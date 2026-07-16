import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { emitToAdmins } from "../../../helpers/socketHelper.js";
import { formatAvatarUrl } from "../../../helpers/fileHelper.js";

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
    const days = durationDays || (type === "weekly" ? 7 : type === "monthly" ? 30 : 365);
    endDate.setDate(now.getDate() + days);

    const sub = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: { userId: targetUserId, type, startDate: now, endDate, token: "admin_granted" },
      update: { type, endDate, token: "admin_granted" },
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
            select: { id: true, name: true, email: true, avatarUrl: true, role: true }
          }
        }
      }),
      prisma.subscription.count({ where })
    ]);

    const formattedSubscriptions = subscriptions.map((sub: any) => {
      if (sub.user) {
        sub.user.avatarUrl = formatAvatarUrl(sub.user.avatarUrl, req);
      }
      return sub;
    });

    res.status(StatusCodes.OK).json({
      data: formattedSubscriptions,
      meta: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    next(error);
  }
};

export const SubscriptionController = {
  getMySubscription,
  adminGrantSubscription,
  adminListSubscriptions,
};
