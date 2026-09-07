import express from "express";
import { SubscriptionController } from "./subscription.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

// Current User's Subscription
router.get("/me", auth(), SubscriptionController.getMySubscription);

// Google Play In-App Purchase & Subscription Verification
router.post("/verify-subscription", auth(), SubscriptionController.verifySubscription);
router.post("/verify-product", auth(), SubscriptionController.verifyOneTimeProduct);

// Google Cloud Pub/Sub RTDN Webhook (Public webhook endpoint for Google Cloud Pub/Sub Push)
router.post("/google-pubsub-webhook", SubscriptionController.handlePubSubWebhook);

// Admin routes
router.post("/admin-grant", auth(), SubscriptionController.adminGrantSubscription);
router.get("/admin/all", auth("ADMIN"), SubscriptionController.adminListSubscriptions);

export const SubscriptionRoutes = router;
