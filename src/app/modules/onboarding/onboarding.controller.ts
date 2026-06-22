import { Request, Response, NextFunction } from "express";
import { OnboardingService } from "./onboarding.service.js";
import { StatusCodes } from "http-status-codes";

const getOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await OnboardingService.getOptions();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Onboarding options retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const seedStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { step } = req.params;
    const result = await OnboardingService.seedStep(Number(step));
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// Contraception
const createContraception = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await OnboardingService.createContraception(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Contraception option created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteContraception = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await OnboardingService.deleteContraception(id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Contraception option deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Contraception Details
const createContraceptionDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await OnboardingService.createContraceptionDetail(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Contraception detail option created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteContraceptionDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await OnboardingService.deleteContraceptionDetail(id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Contraception detail option deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Goals
const createGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await OnboardingService.createGoal(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Goal option created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await OnboardingService.deleteGoal(id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Goal option deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Symptoms
const createSymptom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await OnboardingService.createSymptom(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Symptom option created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSymptom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await OnboardingService.deleteSymptom(id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Symptom option deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Daily Check-ins
const createDailyCheckIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await OnboardingService.createDailyCheckIn(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Daily check-in option created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDailyCheckIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await OnboardingService.deleteDailyCheckIn(id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Daily check-in option deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const OnboardingController = {
  getOptions,
  seedStep,
  createContraception,
  deleteContraception,
  createContraceptionDetail,
  deleteContraceptionDetail,
  createGoal,
  deleteGoal,
  createSymptom,
  deleteSymptom,
  createDailyCheckIn,
  deleteDailyCheckIn,
};
