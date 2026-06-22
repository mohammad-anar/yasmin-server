import express from "express";
import { CycleController } from "./cycle.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

// CycleData routes
router.post("/cycle-data", auth(), CycleController.createCycleData);
router.get("/cycle-data", auth(), CycleController.getCycleData);
router.put("/cycle-data/:id", auth(), CycleController.updateCycleData);
router.delete("/cycle-data/:id", auth(), CycleController.deleteCycleData);
router.get("/phase-guide", auth(), CycleController.getPhaseGuides);

// DailyLog routes
router.post("/daily-logs", auth(), CycleController.createDailyLog);
router.get("/daily-logs", auth(), CycleController.getDailyLogs);
router.put("/daily-logs/:id", auth(), CycleController.updateDailyLog);
router.delete("/daily-logs/:id", auth(), CycleController.deleteDailyLog);

// SymptomLog routes
router.post("/symptom-logs", auth(), CycleController.createSymptomLog);
router.get("/symptom-logs", auth(), CycleController.getSymptomLogs);
router.put("/symptom-logs/:id", auth(), CycleController.updateSymptomLog);
router.delete("/symptom-logs/:id", auth(), CycleController.deleteSymptomLog);

export const CycleRoutes = router;
