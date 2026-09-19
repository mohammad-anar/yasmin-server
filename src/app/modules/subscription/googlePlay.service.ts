import { google, androidpublisher_v3 } from "googleapis";
import path from "path";
import fs from "fs";
import config from "../../../config/index.js";

let playDeveloperApi: androidpublisher_v3.Androidpublisher | null = null;

export const getGooglePlayApi = (): androidpublisher_v3.Androidpublisher => {
  if (playDeveloperApi) {
    return playDeveloperApi;
  }

  let auth: any;

  // 1. Check if Base64 encoded Service Account JSON is provided
  if (config.google_play.service_account_base64) {
    try {
      const decodedJson = Buffer.from(
        config.google_play.service_account_base64.trim(),
        "base64"
      ).toString("utf-8");
      const credentials = JSON.parse(decodedJson);

      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
      });
    } catch (err: any) {
      console.error(
        "Failed to initialize Google Auth from GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64:",
        err?.message || err
      );
    }
  }

  // 2. Check if direct Service Account credentials exist in .env
  if (!auth && config.google_play.service_account_email && config.google_play.service_account_key) {
    const formattedPrivateKey = config.google_play.service_account_key
      .replace(/\\n/g, "\n")
      .replace(/^"|"$/g, ""); // strip surrounding quotes if any

    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.google_play.service_account_email,
        private_key: formattedPrivateKey,
      },
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
  }

  // 3. Fallback to service-account-key.json file path
  if (!auth) {
    const filePath =
      config.google_play.service_account_path ||
      config.google_play.credentials_path ||
      "./service-account-key.json";
    const credentialsPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    if (!fs.existsSync(credentialsPath)) {
      throw new Error(
        `Google Service Account credentials not found. Provide GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64, GOOGLE_PLAY_SERVICE_ACCOUNT_PATH, or place service-account-key.json at ${credentialsPath}`
      );
    }

    auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
  }

  playDeveloperApi = google.androidpublisher({
    version: "v3",
    auth: auth,
  });

  return playDeveloperApi;
};

/**
 * Check if the product ID is the VIP / Annual subscription product
 */
export const isVipProduct = (productId: string): boolean => {
  if (!productId) return false;
  return (
    productId === config.google_play.vip_product_id ||
    productId.toLowerCase().includes("annual") ||
    productId.toLowerCase().includes("yearly") ||
    productId.toLowerCase().includes("year")
  );
};

/**
 * Check if the product ID is the Regular / Monthly subscription product
 */
export const isRegularProduct = (productId: string): boolean => {
  if (!productId) return false;
  return (
    productId === config.google_play.regular_product_id ||
    productId.toLowerCase().includes("monthly") ||
    productId.toLowerCase().includes("regular")
  );
};

export const getGooglePlayPackageName = (): string => {
  return config.google_play.package_name;
};

export const getGooglePlayProductIds = () => {
  return {
    regular: config.google_play.regular_product_id,
    vip: config.google_play.vip_product_id,
  };
};
