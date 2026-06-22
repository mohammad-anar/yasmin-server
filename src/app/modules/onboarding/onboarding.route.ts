import express from "express";
import { OnboardingController } from "./onboarding.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

// Public / client endpoint
router.get("/options", OnboardingController.getOptions);

// Admin-only endpoints
router.post("/seed/:step", auth("ADMIN"), OnboardingController.seedStep);

router.post("/contraception", auth("ADMIN"), OnboardingController.createContraception);
router.delete("/contraception/:id", auth("ADMIN"), OnboardingController.deleteContraception);

router.post("/contraception-detail", auth("ADMIN"), OnboardingController.createContraceptionDetail);
router.delete("/contraception-detail/:id", auth("ADMIN"), OnboardingController.deleteContraceptionDetail);

router.post("/goal", auth("ADMIN"), OnboardingController.createGoal);
router.delete("/goal/:id", auth("ADMIN"), OnboardingController.deleteGoal);

router.post("/symptom", auth("ADMIN"), OnboardingController.createSymptom);
router.delete("/symptom/:id", auth("ADMIN"), OnboardingController.deleteSymptom);

router.post("/daily-check-in", auth("ADMIN"), OnboardingController.createDailyCheckIn);
router.delete("/daily-check-in/:id", auth("ADMIN"), OnboardingController.deleteDailyCheckIn);

export const OnboardingRoutes = router;
