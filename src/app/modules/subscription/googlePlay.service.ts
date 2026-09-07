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

  // 1. Check if direct Service Account credentials exist in .env (recommended for Docker/Production)
  if (config.google_play.service_account_email && config.google_play.service_account_key) {
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
  } else {
    // 2. Fallback to service-account-key.json file path
    const credentialsPath = path.isAbsolute(config.google_play.credentials_path)
      ? config.google_play.credentials_path
      : path.join(process.cwd(), config.google_play.credentials_path);

    if (!fs.existsSync(credentialsPath)) {
      throw new Error(
        `Google Service Account credentials not found. Either provide GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY in .env, or place service-account-key.json at ${credentialsPath}`
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
