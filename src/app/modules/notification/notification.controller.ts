import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";

const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const result = await prisma.notification.findMany({
      where: { created_by: user.email },
      orderBy: { createdAt: "desc" }
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.notification.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "Notification not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    const result = await prisma.notification.update({
      where: { id },
      data: req.body
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.notification.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "Notification not found");
    if (record.created_by !== user.email) throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");

    await prisma.notification.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const NotificationController = {
  getNotifications,
  updateNotification,
  deleteNotification
};
