import express from "express";
import { NutritionController } from "./nutrition.controller.js";
import auth from "../../middlewares/auth.js";
import subscriptionGuard from "../../middlewares/subscriptionGuard.js";

const router = express.Router();

// Foods routes
router.get("/foods", auth(), subscriptionGuard, NutritionController.getFoodLibrary);
router.post("/foods", auth("ADMIN"), subscriptionGuard, NutritionController.createFood);
router.put("/foods/:id", auth("ADMIN"), subscriptionGuard, NutritionController.updateFood);
router.delete("/foods/:id", auth("ADMIN"), subscriptionGuard, NutritionController.deleteFood);

// Recipes routes
router.get("/recipes", auth(), subscriptionGuard, NutritionController.getRecipeLibrary);
router.post("/recipes", auth("ADMIN"), subscriptionGuard, NutritionController.createRecipe);
router.put("/recipes/:id", auth("ADMIN"), subscriptionGuard, NutritionController.updateRecipe);
router.delete("/recipes/:id", auth("ADMIN"), subscriptionGuard, NutritionController.deleteRecipe);

export const NutritionRoutes = router;

