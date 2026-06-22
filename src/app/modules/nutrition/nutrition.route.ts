import express from "express";
import { NutritionController } from "./nutrition.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

// Foods routes
router.get("/foods", auth(), NutritionController.getFoodLibrary);
router.post("/foods", auth("ADMIN"), NutritionController.createFood);
router.put("/foods/:id", auth("ADMIN"), NutritionController.updateFood);
router.delete("/foods/:id", auth("ADMIN"), NutritionController.deleteFood);

// Recipes routes
router.get("/recipes", auth(), NutritionController.getRecipeLibrary);
router.post("/recipes", auth("ADMIN"), NutritionController.createRecipe);
router.put("/recipes/:id", auth("ADMIN"), NutritionController.updateRecipe);
router.delete("/recipes/:id", auth("ADMIN"), NutritionController.deleteRecipe);

export const NutritionRoutes = router;
