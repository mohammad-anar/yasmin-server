import express from "express";
import { CommunityController } from "./community.controller.js";
import auth from "../../middlewares/auth.js";
import subscriptionGuard from "../../middlewares/subscriptionGuard.js";
import { jwtHelper } from "../../../helpers/jwtHelper.js";
import config from "../../../config/index.js";
import { Secret } from "jsonwebtoken";

const router = express.Router();

// Optional authentication parser for public views and reporting
const optionalAuth = async (req: any, res: any, next: any) => {
  try {
    const tokenWithBearer = req.headers.authorization;
    if (tokenWithBearer && tokenWithBearer.startsWith("Bearer")) {
      const token = tokenWithBearer.split(" ")[1];
      const verifyUser = jwtHelper.verifyToken(token, config.jwt.jwt_secret as Secret);
      req.user = verifyUser;
    }
    next();
  } catch (error) {
    next();
  }
};

// Posts routes
router.post("/posts", auth(), subscriptionGuard, CommunityController.createPost);
router.get("/posts", optionalAuth, CommunityController.getPosts);
router.get("/posts/:id", optionalAuth, CommunityController.getPostById);
router.put("/posts/:id", auth(), subscriptionGuard, CommunityController.updatePost);
router.delete("/posts/:id", auth(), subscriptionGuard, CommunityController.deletePost);

// Comments routes
router.post("/comments", auth(), subscriptionGuard, CommunityController.createComment);
router.get("/comments", optionalAuth, CommunityController.getComments);
router.delete("/comments/:id", auth(), subscriptionGuard, CommunityController.deleteComment);

// Reports routes
router.post("/reports", optionalAuth, CommunityController.createReport);
router.get("/reports", auth("ADMIN"), subscriptionGuard, CommunityController.getReports);
router.put("/reports/:id", auth("ADMIN"), subscriptionGuard, CommunityController.updateReport);

export const CommunityRoutes = router;

