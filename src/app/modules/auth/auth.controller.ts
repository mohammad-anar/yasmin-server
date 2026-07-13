import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import { jwtHelper } from "../../../helpers/jwtHelper.js";
import config from "../../../config/index.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { Secret } from "jsonwebtoken";
import { emailHelper } from "../../../helpers/emailHelper.js";
import { emailTemplate } from "../../shared/emailTemplate.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const JWT_SECRET = config.jwt.jwt_secret as Secret;
const JWT_REFRESH_SECRET = (process.env.JWT_REFRESH_SECRET || config.jwt.jwt_secret) as Secret;
const JWT_EXPIRE = config.jwt.jwt_expire_in as string;
const JWT_REFRESH_EXPIRE = (config.jwt.jwt_refresh_expire_in || "30d") as string;

const makeTokenPair = (payload: { id: string; email: string; role: string }) => {
  const access_token = jwtHelper.createToken(payload, JWT_SECRET, JWT_EXPIRE as any);
  const refresh_token = jwtHelper.createToken(payload, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRE as any);
  return { access_token, refresh_token };
};

const formatUserResponse = async (user: any) => {
  const subscription = user.subscription || await prisma.subscription.findUnique({
    where: { userId: user.id }
  });

  const now = new Date();
  const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
  const trialExpiresAt = new Date(new Date(user.createdAt).getTime() + trialDurationMs);
  const isTrialActive = now <= trialExpiresAt;

  let isSubscriptionActive = false;
  if (subscription) {
    isSubscriptionActive = new Date(subscription.endDate) > now;
  }

  const hasPremiumAccess = user.role?.toUpperCase() === 'ADMIN' || isTrialActive || isSubscriptionActive;

  const { passwordHash, otpCode, otpExpiresAt, ...userRest } = user;

  return {
    ...userRest,
    role: userRest.role.toLowerCase(),
    subscription: subscription ? {
      id: subscription.id,
      type: subscription.type,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isActive: isSubscriptionActive
    } : null,
    trialExpiresAt: trialExpiresAt.toISOString(),
    isTrialActive,
    hasPremiumAccess
  };
};

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, username, name } = req.body;

    if (!email || !password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email and password are required");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          username ? { username } : {},
        ].filter(cond => Object.keys(cond).length > 0)
      }
    });

    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, "User with this email or username already exists");
    }

    const passwordHash = await bcrypt.hash(password, Number(config.bcrypt_salt_round || 10));

    // Generate 4-digit OTP for email verification
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username: username || email.split("@")[0],
        name: name || "",
        role: "USER",
        isVerified: false,
        otpCode,
        otpExpiresAt,
      }
    });

    console.log(`🔑 Signup OTP for ${email}: ${otpCode}`);

    // Send verification email (non-blocking — don't fail registration if email fails)
    const emailVal = emailTemplate.createAccount({ name: name || email, email, otp: Number(otpCode) });
    emailHelper.sendEmail(emailVal).catch((err: any) => console.error("Signup email failed:", err));

    // Return tokens immediately so app can proceed even if email fails
    const payload = { id: newUser.id, email: newUser.email!, role: newUser.role.toLowerCase() };
    const { access_token, refresh_token } = makeTokenPair(payload);
    const userWithSub = await formatUserResponse(newUser);

    res.status(StatusCodes.CREATED).json({
      access_token,
      refresh_token,
      user: userWithSub,
      pending_verification: true,
      message: "Account created. Please verify your email with the OTP sent."
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    if (user.isBlocked) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Your account has been blocked. Please contact support.");
    }

    if (user.deletedAt) {
      throw new ApiError(StatusCodes.FORBIDDEN, "This account no longer exists.");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    const payload = { id: user.id, email: user.email!, role: user.role.toLowerCase() };
    const { access_token, refresh_token } = makeTokenPair(payload);

    const userWithSub = await formatUserResponse(user);

    res.status(StatusCodes.OK).json({
      access_token,
      refresh_token,
      user: userWithSub
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Refresh token is required");
    }

    let decoded: any;
    try {
      decoded = jwtHelper.verifyToken(refresh_token, JWT_REFRESH_SECRET);
    } catch {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token");
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
    if (user.isBlocked) throw new ApiError(StatusCodes.FORBIDDEN, "Account is blocked");
    if (user.deletedAt) throw new ApiError(StatusCodes.FORBIDDEN, "Account no longer exists");

    const payload = { id: user.id, email: user.email!, role: user.role.toLowerCase() };
    const { access_token, refresh_token: new_refresh_token } = makeTokenPair(payload);

    res.status(StatusCodes.OK).json({ access_token, refresh_token: new_refresh_token });
  } catch (error) {
    next(error);
  }
};

// ─── Me ───────────────────────────────────────────────────────────────────────
const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { subscription: true }
    });
    if (!dbUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    const userWithSub = await formatUserResponse(dbUser);
    res.status(StatusCodes.OK).json(userWithSub);
  } catch (error) {
    next(error);
  }
};

// ─── Update Me ────────────────────────────────────────────────────────────────
const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const data = { ...req.body };
    
    // Prevent email and role changes
    delete data.email;
    delete data.role;
    delete data.passwordHash;

    // Handle password update if password field is sent
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, Number(config.bcrypt_salt_round || 10));
      delete data.password;
    }

    const updated = await prisma.user.update({
      where: { email: user.email },
      data,
      include: { subscription: true }
    });
    const userWithSub = await formatUserResponse(updated);
    res.status(StatusCodes.OK).json(userWithSub);
  } catch (error) {
    next(error);
  }
};

// ─── Delete Account ───────────────────────────────────────────────────────────
const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    await prisma.user.delete({ where: { email: user.email } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser || !dbUser.passwordHash) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    const isMatch = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isMatch) throw new ApiError(StatusCodes.BAD_REQUEST, "Incorrect current password");

    const passwordHash = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_round || 10));
    await prisma.user.update({ where: { email: user.email }, data: { passwordHash } });

    res.status(StatusCodes.OK).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── Public Settings ──────────────────────────────────────────────────────────
const publicSettings = async (req: Request, res: Response, next: NextFunction) => {
  res.status(StatusCodes.OK).json({ public_settings: { auth_required: false } });
};

// ─── Admin: List Users ────────────────────────────────────────────────────────
const adminListUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeUser = req.user;
    if (!activeUser) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    if (activeUser.role?.toLowerCase() !== "admin") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admin access required");
    }

    const {
      page = "1",
      limit = "20",
      search = "",
      role,
      isBlocked,
      includeDeleted = "false",
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role.toUpperCase();
    if (isBlocked !== undefined) where.isBlocked = isBlocked === "true";
    if (includeDeleted !== "true") where.deletedAt = null;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          isBlocked: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          platform: true,
          language: true,
          subscription: {
            select: { type: true, endDate: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const result = users.map((u: any) => ({ ...u, role: u.role.toLowerCase() }));

    res.status(StatusCodes.OK).json({
      data: result,
      meta: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Get Single User ───────────────────────────────────────────────────
const adminGetUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeUser = req.user;
    if (!activeUser) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    if (activeUser.role?.toLowerCase() !== "admin") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admin access required");
    }

    const { id } = req.params as Record<string, string>;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
        subscription: true,
      }
    });

    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    res.status(StatusCodes.OK).json({ ...user, role: user.role.toLowerCase() });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Block / Unblock User ─────────────────────────────────────────────
const adminBlockUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeUser = req.user;
    if (!activeUser) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    if (activeUser.role?.toLowerCase() !== "admin") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admin access required");
    }

    const { id } = req.params as Record<string, string>;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    const updated = await prisma.user.update({
      where: { id },
      data: { isBlocked: !existing.isBlocked }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      isBlocked: updated.isBlocked,
      message: updated.isBlocked ? "User blocked successfully" : "User unblocked successfully"
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Soft-Delete User ──────────────────────────────────────────────────
const adminDeleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeUser = req.user;
    if (!activeUser) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    if (activeUser.role?.toLowerCase() !== "admin") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admin access required");
    }

    const { id } = req.params as Record<string, string>;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    // Toggle soft-delete (restore if already deleted)
    const newDeletedAt = existing.deletedAt ? null : new Date();
    await prisma.user.update({ where: { id }, data: { deletedAt: newDeletedAt } });

    res.status(StatusCodes.OK).json({
      success: true,
      deleted: newDeletedAt !== null,
      message: newDeletedAt ? "User soft-deleted successfully" : "User restored successfully"
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Stats ─────────────────────────────────────────────────────────────
const adminStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeUser = req.user;
    if (!activeUser) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    if (activeUser.role?.toLowerCase() !== "admin") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admin access required");
    }

    const [totalUsers, premiumUsers, blockedUsers, deletedUsers, activeSubscriptions] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: "PREMIUM", deletedAt: null } }),
      prisma.user.count({ where: { isBlocked: true, deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: { not: null } } }),
      prisma.subscription.count({ where: { endDate: { gte: new Date() } } }),
    ]);

    // Last 30 days registrations by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" }
    });

    // Subscription type breakdown
    const subBreakdown = await prisma.subscription.groupBy({
      by: ["type"],
      _count: { type: true }
    });

    res.status(StatusCodes.OK).json({
      totalUsers,
      premiumUsers,
      blockedUsers,
      deletedUsers,
      activeSubscriptions,
      recentUsers,
      subscriptionBreakdown: subBreakdown.map((s: any) => ({ type: s.type, count: s._count.type }))
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found with this email");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save to database
    await prisma.user.update({
      where: { email },
      data: { otpCode, otpExpiresAt },
    });

    console.log(`🔑 OTP code for ${email} is: ${otpCode}`);

    // Send email
    const emailVal = emailTemplate.resetPassword({ email, otp: Number(otpCode) });
    await emailHelper.sendEmail(emailVal);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Signup OTP ────────────────────────────────────────────────────────
const verifySignupOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email and OTP are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    // If already verified, just return tokens (idempotent)
    if (user.isVerified && !user.otpCode) {
      const payload = { id: user.id, email: user.email!, role: user.role.toLowerCase() };
      const { access_token, refresh_token } = makeTokenPair(payload);
      const userWithSub = await formatUserResponse(user);
      return res.status(StatusCodes.OK).json({ access_token, refresh_token, user: userWithSub });
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP has expired or is invalid. Please register again.");
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP code has expired");
    }

    if (user.otpCode !== otp.toString()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Incorrect OTP code");
    }

    // Mark verified and clear OTP
    const verified = await prisma.user.update({
      where: { email },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null },
      include: { subscription: true }
    });

    const payload = { id: verified.id, email: verified.email!, role: verified.role.toLowerCase() };
    const { access_token, refresh_token } = makeTokenPair(payload);
    const userWithSub = await formatUserResponse(verified);

    res.status(StatusCodes.OK).json({
      access_token,
      refresh_token,
      user: userWithSub,
      message: "Email verified successfully"
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────
const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email and OTP are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP has expired or is invalid");
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP code has expired");
    }

    if (user.otpCode !== otp.toString()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Incorrect OTP code");
    }

    // OTP matches! Generate a short-lived reset token (valid for 15 minutes)
    const resetToken = jwtHelper.createToken({ email }, JWT_SECRET, "15m");

    res.status(StatusCodes.OK).json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ──────────────────────────────────────────────────────────
const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Reset token and new password are required");
    }

    let decoded: any;
    try {
      decoded = jwtHelper.verifyToken(resetToken, JWT_SECRET);
    } catch {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired reset token");
    }

    const email = decoded.email;
    if (!email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid token payload");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    const passwordHash = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_round || 10));

    await prisma.user.update({
      where: { email },
      data: { 
        passwordHash,
        otpCode: null,
        otpExpiresAt: null
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const AuthController = {
  register,
  login,
  refreshToken,
  me,
  updateMe,
  deleteAccount,
  changePassword,
  publicSettings,
  adminListUsers,
  adminGetUser,
  adminBlockUser,
  adminDeleteUser,
  adminStats,
  forgotPassword,
  verifyOtp,
  verifySignupOtp,
  resetPassword,
};
