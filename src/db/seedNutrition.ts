import { prisma } from "../helpers/prisma.js";
import fs from "fs";
import path from "path";

export const seedNutrition = async () => {
  try {
    const foodCount = await prisma.food.count();
    const recipeCount = await prisma.recipe.count();

    if (foodCount > 0 && recipeCount > 0) {
      console.log("[Nutrition Seed] Foods and recipes already seeded.");
      return;
    }

    const foodsPath = path.join(process.cwd(), "../herwellness/public/data/foods.json");
    const recipesPath = path.join(process.cwd(), "../herwellness/public/data/recipes.json");

    if (foodCount === 0 && fs.existsSync(foodsPath)) {
      const foodsData = JSON.parse(fs.readFileSync(foodsPath, "utf-8"));
      for (const food of foodsData) {
        const { id, ...dataWithoutId } = food;
        await prisma.food.create({ data: dataWithoutId });
      }
      console.log(`[Nutrition Seed] Seeded ${foodsData.length} foods successfully.`);
    } else if (foodCount === 0) {
      console.warn(`[Nutrition Seed] Foods JSON file not found at ${foodsPath}`);
    }

    if (recipeCount === 0 && fs.existsSync(recipesPath)) {
      const recipesData = JSON.parse(fs.readFileSync(recipesPath, "utf-8"));
      for (const recipe of recipesData) {
        const { id, ...dataWithoutId } = recipe;
        await prisma.recipe.create({ data: dataWithoutId });
      }
      console.log(`[Nutrition Seed] Seeded ${recipesData.length} recipes successfully.`);
    } else if (recipeCount === 0) {
      console.warn(`[Nutrition Seed] Recipes JSON file not found at ${recipesPath}`);
    }

  } catch (error) {
    console.error("[Nutrition Seed] Error seeding nutrition data:", error);
  }
};
