import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { emitNotification } from "../../../helpers/socketHelper.js";
import { sendNotification } from "../../../helpers/notificationHelper.js";

// Helper to calculate phase
const calculateCurrentPhase = (startDateStr: string, cycleLength: number): { phase: string; cycleDay: number } => {
  const startDate = new Date(startDateStr + "T00:00:00");
  const today = new Date();
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Handle past and future dates correctly
  const cycleDay = ((diffDays % cycleLength + cycleLength) % cycleLength) + 1;
  
  let phase = "follicular";
  if (cycleDay <= 5) phase = "menstrual";
  else if (cycleDay <= 13) phase = "follicular";
  else if (cycleDay <= 16) phase = "ovulatory";
  else phase = "luteal";
  
  return { phase, cycleDay };
};

// Helper to parse query parameters
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

// ─── CycleData Controllers ──────────────────────────────────────────────────
const createCycleData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const data = { ...req.body, created_by: user.email };
    const result = await prisma.cycleData.create({ data });

    // Send stage notification via helper (DB save + Socket + FCM push)
    if (result.cycle_start_date) {
      const { phase, cycleDay } = calculateCurrentPhase(result.cycle_start_date, result.cycle_length || 28);
      const displayPhase = phase.charAt(0).toUpperCase() + phase.slice(1);
      const message = `Your cycle parameters were updated. Your current phase is: ${displayPhase} (Day ${cycleDay}).`;

      await sendNotification({
        email: user.email,
        type: "menstrual_stage",
        title: "Menstrual Stage Update",
        message,
        data: { phase, cycleDay: String(cycleDay) },
      }).catch(err => console.error("Failed to send menstrual notification:", err));
    }

    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const getCycleData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const result = await prisma.cycleData.findMany({
      where: { created_by: user.email },
      orderBy: { createdAt: "desc" }
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateCycleData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.cycleData.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "CycleData not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    const result = await prisma.cycleData.update({
      where: { id },
      data: req.body
    });

    // Send stage notification via helper (DB save + Socket + FCM push)
    if (result.cycle_start_date) {
      const { phase, cycleDay } = calculateCurrentPhase(result.cycle_start_date, result.cycle_length || 28);
      const displayPhase = phase.charAt(0).toUpperCase() + phase.slice(1);
      const message = `Your cycle parameters were updated. Your current phase is: ${displayPhase} (Day ${cycleDay}).`;

      await sendNotification({
        email: user.email,
        type: "menstrual_stage",
        title: "Menstrual Stage Update",
        message,
        data: { phase, cycleDay: String(cycleDay) },
      }).catch(err => console.error("Failed to send menstrual notification:", err));
    }

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteCycleData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.cycleData.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "CycleData not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    await prisma.cycleData.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── DailyLog Controllers ────────────────────────────────────────────────────
const createDailyLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const data = { ...req.body, created_by: user.email };
    const result = await prisma.dailyLog.create({ data });

    // Send stage socket notification
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (dbUser && result.phase) {
      const displayPhase = result.phase.charAt(0).toUpperCase() + result.phase.slice(1);
      emitNotification(dbUser.id, {
        type: "menstrual_log",
        title: "Daily Check-in Logged",
        message: `Saved log for ${displayPhase} phase (Day ${result.cycle_day || '?'}).`,
        phase: result.phase,
        cycleDay: result.cycle_day,
      });
    }

    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const getDailyLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const params = getFindParams(req, user.email);
    const result = await prisma.dailyLog.findMany(params);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateDailyLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.dailyLog.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "DailyLog not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    const result = await prisma.dailyLog.update({
      where: { id },
      data: req.body
    });

    // Send stage socket notification
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (dbUser && result.phase) {
      const displayPhase = result.phase.charAt(0).toUpperCase() + result.phase.slice(1);
      emitNotification(dbUser.id, {
        type: "menstrual_log",
        title: "Daily Check-in Logged",
        message: `Saved log for ${displayPhase} phase (Day ${result.cycle_day || '?'}).`,
        phase: result.phase,
        cycleDay: result.cycle_day,
      });
    }

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteDailyLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.dailyLog.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "DailyLog not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    await prisma.dailyLog.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── SymptomLog Controllers ──────────────────────────────────────────────────
const createSymptomLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const data = { ...req.body, created_by: user.email };
    const result = await prisma.symptomLog.create({ data });
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const getSymptomLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const params = getFindParams(req, user.email);
    const result = await prisma.symptomLog.findMany(params);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateSymptomLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.symptomLog.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "SymptomLog not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    const result = await prisma.symptomLog.update({
      where: { id },
      data: req.body
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteSymptomLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.symptomLog.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "SymptomLog not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    await prisma.symptomLog.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getPhaseGuides = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.phaseGuide.findMany();
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const CycleController = {
  createCycleData,
  getCycleData,
  updateCycleData,
  deleteCycleData,
  createDailyLog,
  getDailyLogs,
  updateDailyLog,
  deleteDailyLog,
  createSymptomLog,
  getSymptomLogs,
  updateSymptomLog,
  deleteSymptomLog,
  getPhaseGuides
};

