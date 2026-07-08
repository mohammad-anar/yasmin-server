import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { IntegrationController } from "./integration.controller.js";
import auth from "../../middlewares/auth.js";
import subscriptionGuard from "../../middlewares/subscriptionGuard.js";

const router = express.Router();

const baseUploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, baseUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Upload and Coach AI
router.post("/files/upload", auth(), upload.single("file"), IntegrationController.uploadFile);
router.post("/ai/coach", auth(), subscriptionGuard, IntegrationController.invokeLLM);

// In-app purchase verification
router.post("/iap/verify-apple", auth(), IntegrationController.verifyAppleIAP);
router.post("/iap/verify-google", auth(), IntegrationController.verifyGoogleIAP);

export const IntegrationRoutes = router;

