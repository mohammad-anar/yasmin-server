import express from "express";
import { WorkoutController } from "./workout.controller.js";
import auth from "../../middlewares/auth.js";
import subscriptionGuard from "../../middlewares/subscriptionGuard.js";

const router = express.Router();

router.get("/library", auth(), subscriptionGuard, WorkoutController.getWorkoutLibrary);
router.post("/library", auth("ADMIN"), subscriptionGuard, WorkoutController.addWorkoutToLibrary);
router.put("/library/:id", auth("ADMIN"), subscriptionGuard, WorkoutController.updateWorkoutInLibrary);
router.delete("/library/:id", auth("ADMIN"), subscriptionGuard, WorkoutController.deleteWorkoutFromLibrary);

router.get("/saved", auth(), subscriptionGuard, WorkoutController.getSavedWorkouts);
router.post("/saved", auth(), subscriptionGuard, WorkoutController.saveWorkout);
router.delete("/saved/:workoutId", auth(), subscriptionGuard, WorkoutController.unsaveWorkout);

// WorkoutLog routes
router.post("/workout-logs", auth(), subscriptionGuard, WorkoutController.createWorkoutLog);
router.get("/workout-logs", auth(), subscriptionGuard, WorkoutController.getWorkoutLogs);
router.put("/workout-logs/:id", auth(), subscriptionGuard, WorkoutController.updateWorkoutLog);
router.delete("/workout-logs/:id", auth(), subscriptionGuard, WorkoutController.deleteWorkoutLog);

// WorkoutSession routes
router.post("/workout-sessions", auth(), subscriptionGuard, WorkoutController.createWorkoutSession);
router.get("/workout-sessions", auth(), subscriptionGuard, WorkoutController.getWorkoutSessions);
router.get("/workout-sessions/:id", auth(), subscriptionGuard, WorkoutController.getWorkoutSessionById);
router.put("/workout-sessions/:id", auth(), subscriptionGuard, WorkoutController.updateWorkoutSession);
router.delete("/workout-sessions/:id", auth(), subscriptionGuard, WorkoutController.deleteWorkoutSession);

// PersonalRecord routes
router.post("/personal-records", auth(), subscriptionGuard, WorkoutController.createPersonalRecord);
router.get("/personal-records", auth(), subscriptionGuard, WorkoutController.getPersonalRecords);
router.put("/personal-records/:id", auth(), subscriptionGuard, WorkoutController.updatePersonalRecord);
router.delete("/personal-records/:id", auth(), subscriptionGuard, WorkoutController.deletePersonalRecord);

export const WorkoutRoutes = router;

