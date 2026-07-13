// src/app/modules/integration/integration.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import config from "../../../config/index.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { google } from "googleapis";
import { emitToAdmins } from "../../../helpers/socketHelper.js";

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
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !key || email.includes("your_") || key.includes("your_") || key.includes("-----BEGIN PRIVATE KEY-----\\\n...")) {
    console.warn("Google service account credentials missing; assuming sandbox validation.");
    return { valid: true, expiresDateMs: Date.now() + 30 * 24 * 60 * 60 * 1000, productId };
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key.replace(/\\\\n/g, "\n") },
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const play = google.androidpublisher({ version: "v3", auth });

  try {
    const res = await play.purchases.subscriptions.get({ packageName, subscriptionId: productId, token });
    if (res.data) {
      const active = parseInt(res.data.expiryTimeMillis || "0") > Date.now();
      return { valid: active, expiresDateMs: parseInt(res.data.expiryTimeMillis || "0"), productId };
    }
  } catch {
    try {
      const res = await play.purchases.products.get({ packageName, productId, token });
      if (res.data) {
        const purchased = res.data.purchaseState === 0;
        return { valid: purchased, expiresDateMs: Date.now() + 365 * 24 * 60 * 60 * 1000, productId };
      }
    } catch (err: any) {
      console.error("Google IAP verification failed:", err?.message);
      throw new Error(`Google IAP verification failed: ${err?.message}`);
    }
  }
  return { valid: false };
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
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
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
        else if (prodId.toLowerCase().includes("weekly")) subType = "weekly";

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
      else if (prodId.toLowerCase().includes("weekly")) subType = "weekly";
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
    const pkg = packageName || process.env.ANDROID_PACKAGE_NAME || "com.herwellness.app";
    const result = await verifyWithGoogle(pkg, productId, token);
    if (result.valid) {
      const dbUser = await prisma.user.update({ where: { email: user.email }, data: { role: "PREMIUM" } });
      let subType = "monthly";
      if (productId.toLowerCase().includes("annual") || productId.toLowerCase().includes("yearly") || productId.toLowerCase().includes("year")) subType = "yearly";
      else if (productId.toLowerCase().includes("weekly")) subType = "weekly";
      const endMs = result.expiresDateMs ? result.expiresDateMs : Date.now() + 30 * 24 * 3600 * 1000;
      const sub = await prisma.subscription.upsert({
        where: { userId: dbUser.id },
        create: { userId: dbUser.id, type: subType, startDate: new Date(), endDate: new Date(endMs), token },
        update: { type: subType, endDate: new Date(endMs), token },
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
    res.status(StatusCodes.OK).json({ valid: result.valid, expiresDate: result.expiresDateMs ? new Date(result.expiresDateMs).toISOString() : null, productId: result.productId });
  } catch (err) {
    next(err);
  }
};

export const IntegrationController = { uploadFile, invokeLLM, verifyAppleIAP, verifyGoogleIAP };
