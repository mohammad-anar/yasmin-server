import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { StatusCodes } from "http-status-codes";

// Foods CRUD
const getFoodLibrary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.food.findMany();
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const createFood = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const required = ["emoji", "name", "cat", "phases", "why", "macros"];
    for (const field of required) {
      if (data[field] === undefined) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `${field} is required`);
      }
    }

    const result = await prisma.food.create({
      data: {
        emoji: data.emoji,
        name: data.name,
        cat: data.cat,
        phases: data.phases,
        why: data.why,
        macros: data.macros
      }
    });

    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const updateFood = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const data = req.body;

    const existing = await prisma.food.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Food not found");
    }

    const result = await prisma.food.update({
      where: { id },
      data
    });

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteFood = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const existing = await prisma.food.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Food not found");
    }

    await prisma.food.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true, message: "Food deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Recipes CRUD
const getRecipeLibrary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.recipe.findMany();
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const createRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const required = ["emoji", "name", "phases", "meal", "prepTime", "cals", "tagline", "why", "macros", "ingredients", "steps"];
    for (const field of required) {
      if (data[field] === undefined) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `${field} is required`);
      }
    }

    const result = await prisma.recipe.create({
      data: {
        emoji: data.emoji,
        name: data.name,
        phases: data.phases,
        meal: data.meal,
        prepTime: data.prepTime,
        cals: data.cals,
        tagline: data.tagline,
        why: data.why,
        macros: data.macros,
        ingredients: data.ingredients,
        steps: data.steps
      }
    });

    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const updateRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const data = req.body;

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Recipe not found");
    }

    const result = await prisma.recipe.update({
      where: { id },
      data
    });

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Recipe not found");
    }

    await prisma.recipe.delete({ where: { id } });
    res.status(StatusCodes.OK).json({ success: true, message: "Recipe deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const NutritionController = {
  getFoodLibrary,
  createFood,
  updateFood,
  deleteFood,
  getRecipeLibrary,
  createRecipe,
  updateRecipe,
  deleteRecipe
};
