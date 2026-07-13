import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";

// ─── CommunityPost Controllers ──────────────────────────────────────────────
const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });
    const resolvedAuthorName = dbUser?.name || dbUser?.username || user.email.split("@")[0];

    const data = { 
      ...req.body, 
      created_by: user.email,
      author_name: req.body.author_name || resolvedAuthorName
    };
    const result = await prisma.communityPost.create({ data });
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sort, limit, skip, category } = req.query;
    const where: any = {};
    if (category) {
      where.category = category;
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort) {
      const sortStr = sort as string;
      const isDesc = sortStr.startsWith("-");
      const field = isDesc ? sortStr.slice(1) : sortStr;
      const mappedField = field === "created_date" ? "createdAt" : field;
      orderBy = { [mappedField]: isDesc ? "desc" : "asc" };
    }

    const result = await prisma.communityPost.findMany({
      where,
      orderBy,
      take: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
      include: {
        comments: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const result = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Post not found");
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.communityPost.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "Post not found");

    // Allow liking posts by anyone (if the request only updates likes)
    const isLiking = Object.keys(req.body).length === 1 && req.body.likes !== undefined;
    const isAdmin = user.role?.toLowerCase() === "admin";

    if (!isLiking && record.created_by !== user.email && !isAdmin) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");
    }

    const result = await prisma.communityPost.update({
      where: { id },
      data: req.body
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.communityPost.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "Post not found");

    const isAdmin = user.role?.toLowerCase() === "admin";
    if (record.created_by !== user.email && !isAdmin) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");
    }

    await prisma.communityPost.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── PostComment Controllers ────────────────────────────────────────────────
const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });
    const resolvedAuthorName = dbUser?.name || dbUser?.username || user.email.split("@")[0];

    const data = { 
      ...req.body, 
      created_by: user.email,
      author_name: req.body.author_name || resolvedAuthorName
    };
    const result = await prisma.postComment.create({ data });
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { post_id } = req.query;
    const where: any = {};
    if (post_id) {
      where.post_id = post_id as string;
    }

    const result = await prisma.postComment.findMany({
      where,
      orderBy: { createdAt: "asc" }
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || !user.email) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    const record = await prisma.postComment.findUnique({ where: { id } });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");

    const isAdmin = user.role?.toLowerCase() === "admin";
    if (record.created_by !== user.email && !isAdmin) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden");
    }

    await prisma.postComment.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── ReportedPost Controllers ──────────────────────────────────────────────
const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Anyone can create a report (anonymous or authenticated)
    const user = req.user;
    const data = { ...req.body };
    if (user && user.email) {
      data.created_by = user.email;
    }

    const result = await prisma.reportedPost.create({ data });
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || user.role?.toLowerCase() !== "admin") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admin access required");
    }

    const result = await prisma.reportedPost.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params as Record<string, string>;
    if (!user || user.role?.toLowerCase() !== "admin") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admin access required");
    }

    const result = await prisma.reportedPost.update({
      where: { id },
      data: req.body
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const CommunityController = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  createComment,
  getComments,
  deleteComment,
  createReport,
  getReports,
  updateReport
};
