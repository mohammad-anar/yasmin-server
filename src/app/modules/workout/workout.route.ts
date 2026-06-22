import express from "express";
import { WorkoutController } from "./workout.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

router.get("/library", auth(), WorkoutController.getWorkoutLibrary);
router.post("/library", auth("ADMIN"), WorkoutController.addWorkoutToLibrary);
router.put("/library/:id", auth("ADMIN"), WorkoutController.updateWorkoutInLibrary);
router.delete("/library/:id", auth("ADMIN"), WorkoutController.deleteWorkoutFromLibrary);

router.get("/saved", auth(), WorkoutController.getSavedWorkouts);
router.post("/saved", auth(), WorkoutController.saveWorkout);
router.delete("/saved/:workoutId", auth(), WorkoutController.unsaveWorkout);

// WorkoutLog routes
router.post("/workout-logs", auth(), WorkoutController.createWorkoutLog);
router.get("/workout-logs", auth(), WorkoutController.getWorkoutLogs);
router.put("/workout-logs/:id", auth(), WorkoutController.updateWorkoutLog);
router.delete("/workout-logs/:id", auth(), WorkoutController.deleteWorkoutLog);

// WorkoutSession routes
router.post("/workout-sessions", auth(), WorkoutController.createWorkoutSession);
router.get("/workout-sessions", auth(), WorkoutController.getWorkoutSessions);
router.get("/workout-sessions/:id", auth(), WorkoutController.getWorkoutSessionById);
router.put("/workout-sessions/:id", auth(), WorkoutController.updateWorkoutSession);
router.delete("/workout-sessions/:id", auth(), WorkoutController.deleteWorkoutSession);

// PersonalRecord routes
router.post("/personal-records", auth(), WorkoutController.createPersonalRecord);
router.get("/personal-records", auth(), WorkoutController.getPersonalRecords);
router.put("/personal-records/:id", auth(), WorkoutController.updatePersonalRecord);
router.delete("/personal-records/:id", auth(), WorkoutController.deletePersonalRecord);

export const WorkoutRoutes = router;
