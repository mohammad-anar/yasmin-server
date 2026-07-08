import ApiError from "../../errors/ApiError.js";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../helpers/prisma.js";

const subscriptionGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    // Load full user and subscription from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { subscription: true }
    });

    if (!dbUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    // 1. Admin bypass
    if (dbUser.role?.toUpperCase() === 'ADMIN') {
      return next();
    }

    // 2. Check if 7-day free trial is active (7 days from user creation)
    const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
    const isTrialActive = Date.now() - new Date(dbUser.createdAt).getTime() <= trialDurationMs;
    if (isTrialActive) {
      return next();
    }

    // 3. Check if subscription is active
    if (dbUser.subscription) {
      const isSubscriptionActive = new Date(dbUser.subscription.endDate) > new Date();
      if (isSubscriptionActive) {
        return next();
      }
    }

    // If neither trial nor subscription is active, deny access
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Access Denied: This content requires an active subscription. Please upgrade your plan."
    );
  } catch (error) {
    next(error);
  }
};

export default subscriptionGuard;

