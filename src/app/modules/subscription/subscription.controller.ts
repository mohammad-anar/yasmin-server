import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { emitToAdmins } from "../../../helpers/socketHelper.js";
import { formatAvatarUrl } from "../../../helpers/fileHelper.js";
import {
  getGooglePlayApi,
  isVipProduct,
  isRegularProduct,
} from "./googlePlay.service.js";
import config from "../../../config/index.js";

// ─── 1. Get Current User Subscription ─────────────────────────────────────────
const getMySubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    const subscription = await prisma.subscription.findUnique({ where: { userId: dbUser.id } });
    res.status(StatusCodes.OK).json(subscription);
  } catch (error) {
    next(error);
  }
};

// ─── 2. Verify Google Play Subscription (v2 API) ──────────────────────────────
const verifySubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { purchaseToken, productId, userId } = req.body;

    if (!purchaseToken || !productId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "purchaseToken and productId are required");
    }

    // Determine target user
    const authenticatedUser = req.user;
    let targetUserId = userId;

    if (authenticatedUser?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: authenticatedUser.email } });
      if (dbUser) {
        targetUserId = dbUser.id;
      }
    }

    if (!targetUserId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User authentication required");
    }

    const packageName = config.google_play.package_name;
    const playDeveloperApi = getGooglePlayApi();

    // Call Google Play Subscription v2 API
    const response = await playDeveloperApi.purchases.subscriptionsv2.get({
      packageName: packageName,
      token: purchaseToken,
    });

    const subData = response.data;
    const subscriptionState = subData.subscriptionState;

    /*
      Google Subscription States:
      - SUBSCRIPTION_STATE_ACTIVE
      - SUBSCRIPTION_STATE_IN_GRACE_PERIOD
      - SUBSCRIPTION_STATE_ON_HOLD
      - SUBSCRIPTION_STATE_PAUSED
      - SUBSCRIPTION_STATE_CANCELED
      - SUBSCRIPTION_STATE_EXPIRED
    */

    if (
      subscriptionState === "SUBSCRIPTION_STATE_ACTIVE" ||
      subscriptionState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
    ) {
      const lineItem = subData.lineItems && subData.lineItems[0];
      const expiryTime = lineItem?.expiryTime;
      const orderId = subData.latestOrderId || (subData as any).orderId || null;

      const endDate = expiryTime ? new Date(expiryTime) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const isVip = isVipProduct(productId);
      const isRegular = isRegularProduct(productId);
      const subType = isVip ? "yearly" : "monthly";

      // Upsert Subscription in Database
      const updatedSub = await prisma.subscription.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          platform: "android",
          productId,
          purchaseToken,
          orderId,
          subscriptionState: "ACTIVE",
          type: subType,
          startDate: new Date(),
          endDate: endDate,
          token: purchaseToken,
        },
        update: {
          platform: "android",
          productId,
          purchaseToken,
          orderId,
          subscriptionState: "ACTIVE",
          type: subType,
          startDate: new Date(),
          endDate: endDate,
          token: purchaseToken,
        },
      });

      // Elevate User Role to PREMIUM
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { role: "PREMIUM" },
      });

      // Emit socket notification to admins
      emitToAdmins("subscription_created", {
        subscription: updatedSub,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatarUrl,
        },
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Subscription successfully verified",
        data: {
          subscriptionState,
          expiryTime: endDate,
          subscription: updatedSub,
          tier: isVip ? "VIP" : isRegular ? "REGULAR" : "STANDARD",
          productId,
        },
      });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Subscription is not active. Current state: ${subscriptionState}`,
      });
    }
  } catch (error: any) {
    console.error("Subscription verification error:", error?.message || error);
    next(error);
  }
};

// ─── 3. Verify One-Time / Consumable Product ──────────────────────────────────
const verifyOneTimeProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, purchaseToken } = req.body;

    if (!productId || !purchaseToken) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "productId and purchaseToken are required");
    }

    const packageName = config.google_play.package_name;
    const playDeveloperApi = getGooglePlayApi();

    const response = await playDeveloperApi.purchases.products.get({
      packageName: packageName,
      productId: productId,
      token: purchaseToken,
    });

    const productData = response.data;

    // purchaseState: 0 (Purchased), 1 (Canceled), 2 (Pending)
    if (productData.purchaseState === 0) {
      // Acknowledge if not acknowledged yet
      if (productData.acknowledgementState === 0) {
        await playDeveloperApi.purchases.products.acknowledge({
          packageName: packageName,
          productId: productId,
          token: purchaseToken,
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Product purchase verified and acknowledged",
        orderId: productData.orderId,
      });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Purchase is pending or canceled",
      });
    }
  } catch (error: any) {
    console.error("Product verification error:", error?.message || error);
    next(error);
  }
};

// ─── 4. Real-Time Developer Notifications (RTDN Webhook) ───────────────────────
const handlePubSubWebhook = async (req: Request, res: Response) => {
  try {
    const message = req.body.message;

    if (!message || !message.data) {
      return res.status(StatusCodes.BAD_REQUEST).send("No message received");
    }

    // 1. Base64 decode
    const decodedJson = Buffer.from(message.data, "base64").toString("utf-8");
    const rtdnData = JSON.parse(decodedJson);

    console.log("RTDN Event Received:", JSON.stringify(rtdnData, null, 2));

    // 2. Handle Subscription Notifications
    if (rtdnData.subscriptionNotification) {
      const { notificationType, purchaseToken, subscriptionId } = rtdnData.subscriptionNotification;

      /*
        Notification Types:
        (1) SUBSCRIPTION_RECOVERED  -> Payment recovered
        (2) SUBSCRIPTION_RENEWED    -> Renewed automatically (extend expiry)
        (3) SUBSCRIPTION_CANCELED   -> User cancelled auto-renewal
        (4) SUBSCRIPTION_PURCHASED  -> New purchase
        (5) SUBSCRIPTION_ON_HOLD    -> Payment failed / on hold
        (12) SUBSCRIPTION_REVOKED   -> Refunded / revoked (revoke access immediately)
        (13) SUBSCRIPTION_EXPIRED   -> Expired (revoke access)
      */

      const packageName = config.google_play.package_name;
      const playDeveloperApi = getGooglePlayApi();

      if (purchaseToken) {
        const existingSub = await prisma.subscription.findFirst({
          where: { purchaseToken },
        });

        if (existingSub) {
          switch (notificationType) {
            case 1: // RECOVERED
            case 2: // RENEWED
              try {
                const subCheck = await playDeveloperApi.purchases.subscriptionsv2.get({
                  packageName,
                  token: purchaseToken,
                });
                const lineItem = subCheck.data.lineItems && subCheck.data.lineItems[0];
                const newExpiry = lineItem?.expiryTime ? new Date(lineItem.expiryTime) : undefined;

                await prisma.subscription.update({
                  where: { id: existingSub.id },
                  data: {
                    subscriptionState: "ACTIVE",
                    ...(newExpiry ? { endDate: newExpiry } : {}),
                  },
                });

                await prisma.user.update({
                  where: { id: existingSub.userId },
                  data: { role: "PREMIUM" },
                });
              } catch (subErr) {
                console.error("Error refreshing subscription from Google API:", subErr);
              }
              break;

            case 3: // CANCELED
              await prisma.subscription.update({
                where: { id: existingSub.id },
                data: { subscriptionState: "CANCELED" },
              });
              break;

            case 12: // REVOKED
            case 13: // EXPIRED
              await prisma.subscription.update({
                where: { id: existingSub.id },
                data: { subscriptionState: notificationType === 12 ? "REVOKED" : "EXPIRED" },
              });

              await prisma.user.update({
                where: { id: existingSub.userId },
                data: { role: "USER" },
              });
              break;

            default:
              console.log(`[RTDN] Unhandled notificationType: ${notificationType} for ${subscriptionId}`);
          }
        }
      }
    }

    // 3. Always return 200 OK so Google Pub/Sub acknowledges the message
    return res.status(StatusCodes.OK).send("Event Processed");
  } catch (error) {
    console.error("PubSub Webhook Error:", error);
    return res.status(StatusCodes.OK).send("Error Acknowledged");
  }
};

// ─── 5. Admin Grant Subscription ──────────────────────────────────────────────
const adminGrantSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeUser = req.user;
    if (!activeUser || !activeUser.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const dbActiveUser = await prisma.user.findUnique({ where: { email: activeUser.email } });
    if (!dbActiveUser || dbActiveUser.role !== "ADMIN") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden: Admins only");
    }

    const { targetUserId, type, durationDays } = req.body;
    if (!targetUserId || !type) throw new ApiError(StatusCodes.BAD_REQUEST, "targetUserId and type are required");

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new ApiError(StatusCodes.NOT_FOUND, "Target user not found");

    const now = new Date();
    const endDate = new Date();
    const days = durationDays || (type === "monthly" ? 30 : 365);
    endDate.setDate(now.getDate() + days);

    const sub = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        type,
        startDate: now,
        endDate,
        token: "admin_granted",
        subscriptionState: "ACTIVE",
        platform: "admin",
      },
      update: {
        type,
        endDate,
        token: "admin_granted",
        subscriptionState: "ACTIVE",
      },
    });

    await prisma.user.update({ where: { id: targetUserId }, data: { role: "PREMIUM" } });

    // Emit socket event to notify admins
    emitToAdmins("subscription_created", {
      subscription: sub,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
      },
    });

    res.status(StatusCodes.OK).json({ success: true, subscription: sub });
  } catch (error) {
    next(error);
  }
};

// ─── 6. Admin List Subscriptions ──────────────────────────────────────────────
const adminListSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeUser = req.user;
    if (!activeUser) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    if (activeUser.role?.toLowerCase() !== "admin") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admin access required");
    }

    const { page = "1", limit = "20", type, status } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (type) where.type = type;
    if (status === "active") where.endDate = { gte: new Date() };
    if (status === "expired") where.endDate = { lt: new Date() };

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, role: true },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    const now = new Date();
    const formattedSubscriptions = subscriptions.map((sub: any) => {
      if (sub.user) {
        sub.user.avatarUrl = formatAvatarUrl(sub.user.avatarUrl, req);
        if (sub.user.role !== "ADMIN") {
          const isSubActive =
            new Date(sub.endDate) > now &&
            sub.subscriptionState !== "EXPIRED" &&
            sub.subscriptionState !== "REVOKED";
          sub.user.role = isSubActive ? "PREMIUM" : "USER";
        }
      }
      return sub;
    });

    res.status(StatusCodes.OK).json({
      data: formattedSubscriptions,
      meta: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    next(error);
  }
};

export const SubscriptionController = {
  getMySubscription,
  verifySubscription,
  verifyOneTimeProduct,
  handlePubSubWebhook,
  adminGrantSubscription,
  adminListSubscriptions,
};
