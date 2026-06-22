import express from "express";
import { AuthRoutes } from "../modules/auth/auth.route.js";
import { CycleRoutes } from "../modules/cycle/cycle.route.js";
import { WorkoutRoutes } from "../modules/workout/workout.route.js";
import { CommunityRoutes } from "../modules/community/community.route.js";
import { NotificationRoutes } from "../modules/notification/notification.route.js";
import { ProfileRoutes } from "../modules/profile/profile.route.js";
import { IntegrationRoutes } from "../modules/integration/integration.route.js";
import { SubscriptionRoutes } from "../modules/subscription/subscription.route.js";
import { OnboardingRoutes } from "../modules/onboarding/onboarding.route.js";
import { NutritionRoutes } from "../modules/nutrition/nutrition.route.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/cycle", route: CycleRoutes },
  { path: "/workout", route: WorkoutRoutes },
  { path: "/community", route: CommunityRoutes },
  { path: "/notification", route: NotificationRoutes },
  { path: "/profile", route: ProfileRoutes },
  { path: "/integration", route: IntegrationRoutes },
  { path: "/subscription", route: SubscriptionRoutes },
  { path: "/onboarding", route: OnboardingRoutes },
  { path: "/nutrition", route: NutritionRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
