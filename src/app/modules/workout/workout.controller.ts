import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { sendNotification } from "../../../helpers/notificationHelper.js";

// Helper to parse queries
const getFindParams = (req: Request, userEmail: string) => {
  const { sort, limit, skip, date } = req.query;
  const where: any = { created_by: userEmail };

  if (date) {
    where.date = date;
  }

  let orderBy: any = undefined;
  if (sort) {
    const sortStr = sort as string;
    const isDesc = sortStr.startsWith("-");
    const field = isDesc ? sortStr.slice(1) : sortStr;
    const mappedField = field === "created_date" ? "createdAt" : field;
    orderBy = { [mappedField]: isDesc ? "desc" : "asc" };
  }

  return {
    where,
    orderBy,
    take: limit ? Number(limit) : undefined,
    skip: skip ? Number(skip) : undefined,
  };
};

// ─── WorkoutLog Controllers ──────────────────────────────────────────────────
const createWorkoutLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const data = { ...req.body, created_by: user.email };
    const result = await prisma.workoutLog.create({ data });
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const getWorkoutLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const params = getFindParams(req, user.email);
    const result = await prisma.workoutLog.findMany(params);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateWorkoutLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.workoutLog.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "WorkoutLog not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    const result = await prisma.workoutLog.update({
      where: { id },
      data: req.body
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteWorkoutLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.workoutLog.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "WorkoutLog not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    await prisma.workoutLog.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── WorkoutSession Controllers ──────────────────────────────────────────────
const createWorkoutSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const data = { ...req.body, created_by: user.email };
    const result = await prisma.workoutSession.create({ data });

    if (result.completed) {
      const message = `💪 Great workout! You completed "${result.workout_name}" in ${result.duration_minutes} minutes`;
      await sendNotification({
        email: user.email,
        type: "workout_milestone",
        title: "Workout Completed",
        message,
        relatedRecordId: result.id,
        relatedRecordType: "workout_session",
      }).catch((err: any) => console.error("Workout notification failed:", err));
    }

    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const getWorkoutSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const params = getFindParams(req, user.email);
    const result = await prisma.workoutSession.findMany(params);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const getWorkoutSessionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const result = await prisma.workoutSession.findUnique({ where: { id } });
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Workout session not found");
    if (result.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateWorkoutSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.workoutSession.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "WorkoutSession not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    const result = await prisma.workoutSession.update({
      where: { id },
      data: req.body
    });

    if (result.completed && !record.completed) {
      const message = `💪 Great workout! You completed "${result.workout_name}" in ${result.duration_minutes} minutes`;
      await sendNotification({
        email: user.email,
        type: "workout_milestone",
        title: "Workout Completed",
        message,
        relatedRecordId: result.id,
        relatedRecordType: "workout_session",
      }).catch((err: any) => console.error("Workout notification failed:", err));
    }

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteWorkoutSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.workoutSession.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "WorkoutSession not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    await prisma.workoutSession.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── PersonalRecord Controllers ─────────────────────────────────────────────
const createPersonalRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const data = { ...req.body, created_by: user.email };
    if (data.weight_kg && data.reps) {
      data.one_rep_max = data.weight_kg * (1 + data.reps / 30);
    }

    const result = await prisma.personalRecord.create({ data });

    const message = `🎉 New Personal Record! You lifted ${result.weight_kg}kg for ${result.reps} reps on ${result.exercise_name}`;
    await sendNotification({
      email: user.email,
      type: "personal_record",
      title: `New PR: ${result.exercise_name}`,
      message,
      relatedRecordId: result.id,
      relatedRecordType: "personal_record",
    }).catch((err: any) => console.error("PR notification failed:", err));

    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const getPersonalRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const params = getFindParams(req, user.email);
    const result = await prisma.personalRecord.findMany(params);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updatePersonalRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.personalRecord.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "PersonalRecord not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    const data = { ...req.body };
    if (data.weight_kg && data.reps) {
      data.one_rep_max = data.weight_kg * (1 + data.reps / 30);
    }

    const result = await prisma.personalRecord.update({
      where: { id },
      data
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deletePersonalRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.personalRecord.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "PersonalRecord not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    await prisma.personalRecord.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getWorkoutLibrary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workouts = await prisma.workout.findMany();
    res.status(StatusCodes.OK).json(workouts);
  } catch (error) {
    next(error);
  }
};

const addWorkoutToLibrary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const requiredFields = ['name', 'desc', 'phase', 'intensity', 'duration', 'duration_mins', 'bodypart', 'equipment', 'phaseNote', 'exercises'];
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `${field} is required`);
      }
    }

    const result = await prisma.workout.create({
      data: {
        name: data.name,
        desc: data.desc,
        phase: data.phase,
        intensity: data.intensity,
        duration: data.duration,
        duration_mins: Number(data.duration_mins),
        bodypart: data.bodypart,
        equipment: data.equipment,
        phaseNote: data.phaseNote,
        exercises: data.exercises
      }
    });
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteWorkoutFromLibrary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.workout.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true, message: "Workout deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const updateWorkoutInLibrary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingWorkout = await prisma.workout.findUnique({ where: { id } });
    if (!existingWorkout) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Workout not found");
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.desc !== undefined) updateData.desc = data.desc;
    if (data.phase !== undefined) updateData.phase = data.phase;
    if (data.intensity !== undefined) updateData.intensity = data.intensity;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.duration_mins !== undefined) updateData.duration_mins = Number(data.duration_mins);
    if (data.bodypart !== undefined) updateData.bodypart = data.bodypart;
    if (data.equipment !== undefined) updateData.equipment = data.equipment;
    if (data.phaseNote !== undefined) updateData.phaseNote = data.phaseNote;
    if (data.exercises !== undefined) updateData.exercises = data.exercises;

    const result = await prisma.workout.update({
      where: { id },
      data: updateData,
    });

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const getSavedWorkouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.id) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const saved = await prisma.savedWorkout.findMany({
      where: { userId: user.id },
      include: { workout: true }
    });

    res.status(StatusCodes.OK).json(saved.map(s => s.workout));
  } catch (error) {
    next(error);
  }
};

const saveWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.id) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const { workoutId } = req.body;
    if (!workoutId) throw new ApiError(StatusCodes.BAD_REQUEST, "Workout ID is required");

    const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
    if (!workout) throw new ApiError(StatusCodes.NOT_FOUND, "Workout not found");

    const result = await prisma.savedWorkout.upsert({
      where: {
        userId_workoutId: {
          userId: user.id,
          workoutId
        }
      },
      update: {},
      create: {
        userId: user.id,
        workoutId
      },
      include: { workout: true }
    });

    res.status(StatusCodes.CREATED).json(result.workout);
  } catch (error) {
    next(error);
  }
};

const unsaveWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.id) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const { workoutId } = req.params;
    if (!workoutId) throw new ApiError(StatusCodes.BAD_REQUEST, "Workout ID is required");

    await prisma.savedWorkout.delete({
      where: {
        userId_workoutId: {
          userId: user.id,
          workoutId
        }
      }
    });

    res.status(StatusCodes.OK).json({ success: true, message: "Workout unsaved successfully" });
  } catch (error) {
    next(error);
  }
};

export const WorkoutController = {
  createWorkoutLog,
  getWorkoutLogs,
  updateWorkoutLog,
  deleteWorkoutLog,
  createWorkoutSession,
  getWorkoutSessions,
  getWorkoutSessionById,
  updateWorkoutSession,
  deleteWorkoutSession,
  createPersonalRecord,
  getPersonalRecords,
  updatePersonalRecord,
  deletePersonalRecord,
  getWorkoutLibrary,
  addWorkoutToLibrary,
  updateWorkoutInLibrary,
  deleteWorkoutFromLibrary,
  getSavedWorkouts,
  saveWorkout,
  unsaveWorkout
};
