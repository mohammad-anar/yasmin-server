import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const profile = await prisma.userProfile.findUnique({
      where: { created_by: user.email }
    });

    if (!profile) {
      return res.status(StatusCodes.OK).json(null);
    }

    res.status(StatusCodes.OK).json(profile);
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const existing = await prisma.userProfile.findUnique({
      where: { created_by: user.email }
    });

    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, "Profile already exists");
    }

    const data = { ...req.body, created_by: user.email };
    const result = await prisma.userProfile.create({ data });
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const existing = await prisma.userProfile.findUnique({
      where: { created_by: user.email }
    });

    if (!existing) {
      // Auto-create profile if it doesn't exist yet (robust onboarding/update integration)
      const data = { ...req.body, created_by: user.email };
      const result = await prisma.userProfile.create({ data });
      return res.status(StatusCodes.CREATED).json(result);
    }

    const result = await prisma.userProfile.update({
      where: { created_by: user.email },
      data: req.body
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    await prisma.userProfile.delete({
      where: { created_by: user.email }
    });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const ProfileController = {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile
};
