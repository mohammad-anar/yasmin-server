import { google, androidpublisher_v3 } from "googleapis";
import path from "path";
import fs from "fs";
import config from "../../../config/index.js";

let playDeveloperApi: androidpublisher_v3.Androidpublisher | null = null;

export const getGooglePlayApi = (): androidpublisher_v3.Androidpublisher => {
  if (playDeveloperApi) {
    return playDeveloperApi;
  }

  const credentialsPath = path.isAbsolute(config.google_play.credentials_path)
    ? config.google_play.credentials_path
    : path.join(process.cwd(), config.google_play.credentials_path);

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      `Google Service Account key file not found at: ${credentialsPath}. Please place your service-account-key.json in the project root.`
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  playDeveloperApi = google.androidpublisher({
    version: "v3",
    auth: auth,
  });

  return playDeveloperApi;
};
