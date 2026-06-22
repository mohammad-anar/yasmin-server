import express from "express";
import { SubscriptionController } from "./subscription.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

router.get("/me", auth(), SubscriptionController.getMySubscription);
router.post("/admin-grant", auth(), SubscriptionController.adminGrantSubscription);
router.get("/admin/all", auth("ADMIN"), SubscriptionController.adminListSubscriptions);

export const SubscriptionRoutes = router;
