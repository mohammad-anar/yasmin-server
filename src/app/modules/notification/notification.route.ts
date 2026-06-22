import express from "express";
import { NotificationController } from "./notification.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

router.get("/", auth(), NotificationController.getNotifications);
router.put("/:id", auth(), NotificationController.updateNotification);
router.delete("/:id", auth(), NotificationController.deleteNotification);

export const NotificationRoutes = router;
