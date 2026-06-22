import express from "express";
import { ProfileController } from "./profile.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

router.get("/", auth(), ProfileController.getProfile);
router.get("/:id", auth(), ProfileController.getProfile);
router.post("/", auth(), ProfileController.createProfile);
router.put("/", auth(), ProfileController.updateProfile);
router.put("/:id", auth(), ProfileController.updateProfile);
router.delete("/", auth(), ProfileController.deleteProfile);
router.delete("/:id", auth(), ProfileController.deleteProfile);

export const ProfileRoutes = router;
