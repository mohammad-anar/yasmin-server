// src/app/modules/integration/integration.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import config from "../../../config/index.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { emitToAdmins } from "../../../helpers/socketHelper.js";
import {
  getGooglePlayApi,
  isVipProduct,
  isRegularProduct,
} from "../subscription/googlePlay.service.js";

const APPLE_VERIFY_URL_PROD = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_VERIFY_URL_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";

// Apple Receipt Verification helper
async function verifyWithApple(receiptData: string, url: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receiptData,
      password: process.env.APPLE_SHARED_SECRET,
      "exclude-old-transactions": true,
    }),
  });
  return response.json();
}

// Google Play Store Verification helper
async function verifyWithGoogle(packageName: string, productId: string, token: string) {
  const pkg = packageName || config.google_play.package_name || "com.herwellnessapp";

  try {
    const play = getGooglePlayApi();

    // 1. Try modern subscriptionsv2 API
    try {
      const v2Res = await play.purchases.subscriptionsv2.get({
        packageName: pkg,
        token: token,
      });

      if (v2Res.data) {
        const state = v2Res.data.subscriptionState;
        const lineItem = v2Res.data.lineItems && v2Res.data.lineItems[0];
        const expiryTime = lineItem?.expiryTime;
        const expiresDateMs = expiryTime
          ? new Date(expiryTime).getTime()
          : Date.now() + 30 * 24 * 60 * 60 * 1000;
        const active =
          state === "SUBSCRIPTION_STATE_ACTIVE" ||
          state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD";

        return { valid: active, expiresDateMs, productId };
      }
    } catch (_) {
      // Fallback to legacy subscriptions.get
    }

    // 2. Legacy subscriptions.get API
    try {
      const res = await play.purchases.subscriptions.get({
        packageName: pkg,
        subscriptionId: productId,
        token,
      });
      if (res.data) {
        const active = parseInt(res.data.expiryTimeMillis || "0") > Date.now();
        return {
          valid: active,
          expiresDateMs: parseInt(res.data.expiryTimeMillis || "0"),
          productId,
        };
      }
    } catch (_) {
      // Fallback to one-time products.get
    }

    // 3. One-time in-app product check
    const res = await play.purchases.products.get({
      packageName: pkg,
      productId,
      token,
    });
    if (res.data) {
      const purchased = res.data.purchaseState === 0;
      return {
        valid: purchased,
        expiresDateMs: Date.now() + 365 * 24 * 60 * 60 * 1000,
        productId,
      };
    }
  } catch (err: any) {
    console.error("Google IAP verification failed:", err?.message || err);
    throw new Error(`Google IAP verification failed: ${err?.message || err}`);
  }

  return { valid: false, productId };
}

// Invoke Gemini AI Coach API helper
const invokeGemini = async (prompt: string, responseSchema?: any) => {
  const geminiKey = process.env.GEMINI_API_KEY || "";
  if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");
  const payload: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  };
  if (responseSchema) payload.generationConfig.responseSchema = responseSchema;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }
  const result = await res.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return JSON.parse(text);
};

// ─── Controller Methods ──────────────────────────────────────────────────────
const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new ApiError(StatusCodes.BAD_REQUEST, "No file uploaded");
    const backendUrl = config.backend_url || "http://localhost:5000";
    const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;
    res.status(StatusCodes.OK).json({ file_url: fileUrl });
  } catch (err) {
    next(err);
  }
};

const invokeLLM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, response_json_schema } = req.body;
    if (!prompt) throw new ApiError(StatusCodes.BAD_REQUEST, "Prompt required");
    const result = await invokeGemini(prompt, response_json_schema);
    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
};

const verifyAppleIAP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    const { receiptData } = req.body;
    if (!receiptData) throw new ApiError(StatusCodes.BAD_REQUEST, "receiptData required");

    // Simulated/Mock Checkout for development and testing
    if (receiptData === "mock_monthly_receipt" || receiptData === "mock_annual_receipt") {
      const dbUser = await prisma.user.update({ where: { email: user.email }, data: { role: "PREMIUM" } });
      const subType = receiptData === "mock_monthly_receipt" ? "monthly" : "yearly";
      const durationMs = subType === "monthly" ? 30 * 24 * 3600 * 1000 : 365 * 24 * 3600 * 1000;
      const sub = await prisma.subscription.upsert({
        where: { userId: dbUser.id },
        create: { userId: dbUser.id, type: subType, startDate: new Date(), endDate: new Date(Date.now() + durationMs), token: receiptData },
        update: { type: subType, endDate: new Date(Date.now() + durationMs), token: receiptData },
      });

      emitToAdmins("subscription_created", {
        subscription: sub,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          avatarUrl: dbUser.avatarUrl,
        },
      });

      return res.status(StatusCodes.OK).json({
        valid: true,
        isPremium: true,
        expiresDate: sub.endDate.toISOString(),
        productId: subType === "monthly" ? "com.herwellnessapp.monthly" : "com.herwellnessapp.annual"
      });
    }

    // StoreKit 2 / Decrypted local transaction JSON handler
    let isStoreKit2 = false;
    let transactionObj: any = null;

    if (typeof receiptData === "object") {
      transactionObj = receiptData;
      isStoreKit2 = true;
    } else if (typeof receiptData === "string" && receiptData.trim().startsWith("{")) {
      try {
        transactionObj = JSON.parse(receiptData);
        isStoreKit2 = true;
      } catch (_) {}
    }

    if (isStoreKit2 && transactionObj) {
      const prodId = transactionObj.productId || "";
      const expiresDateMs = typeof transactionObj.expiresDate === "number"
        ? transactionObj.expiresDate
        : parseInt(String(transactionObj.expiresDate || "0"));
      const transactionId = transactionObj.transactionId || "";
      const now = Date.now();

      const isPremium = expiresDateMs > now || expiresDateMs === 0;

      if (isPremium) {
        const dbUser = await prisma.user.update({ where: { email: user.email }, data: { role: "PREMIUM" } });
        let subType = "monthly";
        if (prodId.toLowerCase().includes("annual") || prodId.toLowerCase().includes("yearly") || prodId.toLowerCase().includes("year")) subType = "yearly";

        const endMs = expiresDateMs > 0 ? expiresDateMs : Date.now() + 30 * 24 * 3600 * 1000;
        const sub = await prisma.subscription.upsert({
          where: { userId: dbUser.id },
          create: { userId: dbUser.id, type: subType, startDate: new Date(), endDate: new Date(endMs), token: transactionId || "storekit2_sandbox" },
          update: { type: subType, endDate: new Date(endMs), token: transactionId || "storekit2_sandbox" },
        });

        // Emit socket notification
        emitToAdmins("subscription_created", {
          subscription: sub,
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            avatarUrl: dbUser.avatarUrl,
          },
        });

        return res.status(StatusCodes.OK).json({
          valid: true,
          isPremium: true,
          expiresDate: new Date(endMs).toISOString(),
          productId: prodId
        });
      } else {
        return res.status(StatusCodes.OK).json({
          valid: false,
          isPremium: false,
          error: "Subscription has expired"
        });
      }
    }

    const bundleId = process.env.APPLE_BUNDLE_ID;
    let result = await verifyWithApple(receiptData, APPLE_VERIFY_URL_PROD);
    if (result.status === 21007) result = await verifyWithApple(receiptData, APPLE_VERIFY_URL_SANDBOX);
    if (result.status !== 0) return res.status(StatusCodes.OK).json({ valid: false, status: result.status, error: "Receipt verification failed" });
    if (bundleId && result.receipt?.bundle_id !== bundleId) return res.status(StatusCodes.OK).json({ valid: false, error: "Bundle ID mismatch" });
    const latest = result.latest_receipt_info || [];
    const now = Date.now();
    const active = latest.find((r: any) => parseInt(r.expires_date_ms) > now);
    const isPremium = !!active;
    if (isPremium) {
      const dbUser = await prisma.user.update({ where: { email: user.email }, data: { role: "PREMIUM" } });
      const prodId = active?.product_id || "";
      let subType = "monthly";
      if (prodId.toLowerCase().includes("annual") || prodId.toLowerCase().includes("yearly") || prodId.toLowerCase().includes("year")) subType = "yearly";
      const endMs = parseInt(active?.expires_date_ms || String(Date.now() + 30 * 24 * 3600 * 1000));
      const sub = await prisma.subscription.upsert({
        where: { userId: dbUser.id },
        create: { userId: dbUser.id, type: subType, startDate: new Date(), endDate: new Date(endMs), token: receiptData },
        update: { type: subType, endDate: new Date(endMs), token: receiptData },
      });

      // Emit socket notification
      emitToAdmins("subscription_created", {
        subscription: sub,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          avatarUrl: dbUser.avatarUrl,
        },
      });
    }
    res.status(StatusCodes.OK).json({ valid: true, isPremium, expiresDate: active?.expires_date || null, productId: active?.product_id || null });
  } catch (err) {
    next(err);
  }
};

const verifyGoogleIAP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    const { packageName, productId, token } = req.body;
    if (!productId || !token) throw new ApiError(StatusCodes.BAD_REQUEST, "productId and token required");
    const pkg = packageName || config.google_play.package_name || "com.herwellnessapp";
    const result = await verifyWithGoogle(pkg, productId, token);
    const isVip = isVipProduct(productId);
    const isRegular = isRegularProduct(productId);

    if (result.valid) {
      const dbUser = await prisma.user.update({ where: { email: user.email }, data: { role: "PREMIUM" } });
      const subType = isVip ? "yearly" : "monthly";
      const endMs = result.expiresDateMs ? result.expiresDateMs : Date.now() + 30 * 24 * 3600 * 1000;
      const sub = await prisma.subscription.upsert({
        where: { userId: dbUser.id },
        create: {
          userId: dbUser.id,
          platform: "android",
          productId,
          purchaseToken: token,
          subscriptionState: "ACTIVE",
          type: subType,
          startDate: new Date(),
          endDate: new Date(endMs),
          token,
        },
        update: {
          platform: "android",
          productId,
          purchaseToken: token,
          subscriptionState: "ACTIVE",
          type: subType,
          endDate: new Date(endMs),
          token,
        },
      });

      // Emit socket notification
      emitToAdmins("subscription_created", {
        subscription: sub,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          avatarUrl: dbUser.avatarUrl,
        },
      });
    }
    res.status(StatusCodes.OK).json({
      valid: result.valid,
      expiresDate: result.expiresDateMs ? new Date(result.expiresDateMs).toISOString() : null,
      productId: result.productId,
      tier: isVip ? "VIP" : isRegular ? "REGULAR" : "STANDARD",
    });
  } catch (err) {
    next(err);
  }
};

export const IntegrationController = { uploadFile, invokeLLM, verifyAppleIAP, verifyGoogleIAP };
