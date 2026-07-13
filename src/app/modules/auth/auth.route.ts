import express from "express";
import { AuthController } from "./auth.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

// ─── Public routes ─────────────────────────────────────────────────────────
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.get("/public-settings", AuthController.publicSettings);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/verify-signup-otp", AuthController.verifySignupOtp);
router.post("/reset-password", AuthController.resetPassword);

// ─── Authenticated user routes ─────────────────────────────────────────────
router.get("/me", auth(), AuthController.me);
router.put("/me", auth(), AuthController.updateMe);
router.delete("/me", auth(), AuthController.deleteAccount);
router.post("/change-password", auth(), AuthController.changePassword);

// ─── Admin routes ──────────────────────────────────────────────────────────
router.get("/admin/stats", auth("ADMIN"), AuthController.adminStats);
router.get("/admin/users", auth("ADMIN"), AuthController.adminListUsers);
router.get("/admin/users/:id", auth("ADMIN"), AuthController.adminGetUser);
router.patch("/admin/users/:id/block", auth("ADMIN"), AuthController.adminBlockUser);
router.delete("/admin/users/:id", auth("ADMIN"), AuthController.adminDeleteUser);

export const AuthRoutes = router;
