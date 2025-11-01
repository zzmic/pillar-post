import type { Request, Response } from "express";

import db from "../models/index.js";

type Identifier = number | string;

interface CategoryAttributes extends Record<string, unknown> {
  category_id: Identifier;
  name?: string;
  description?: string | null;
  slug?: string;
}

interface CategoryInstance extends CategoryAttributes {
  update: (values: Record<string, unknown>) => Promise<void>;
  destroy: () => Promise<void>;
}

interface CategoryModel {
  create: (values: Record<string, unknown>) => Promise<CategoryInstance>;
  findByPk: (id: unknown) => Promise<CategoryInstance | null>;
}

interface DbModelMap {
  categories?: unknown;
}

const models = db as DbModelMap;

const getModel = <T>(model: unknown, modelName: string): T => {
  if (
    typeof model !== "object" ||
    model === null ||
    typeof (model as { create?: unknown }).create !== "function"
  ) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }

  return model as T;
};

const Category = getModel<CategoryModel>(models.categories, "categories");

interface CategorySuccessResponse<T> {
  status: "success";
  message: string;
  data?: T;
}

interface CategoryFailResponse {
  status: "fail" | "error";
  message: string;
  data?: Record<string, unknown>;
}

export const createCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, description, slug } = req.body as Record<string, unknown>;

    const category = await Category.create({
      name,
      description: description ?? null,
      slug,
    });

    const response: CategorySuccessResponse<{ category: CategoryInstance }> = {
      status: "success",
      message: "Category created successfully",
      data: {
        category,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating category:", error);

    if (
      error instanceof Error &&
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const response: CategoryFailResponse = {
        status: "fail",
        message: "A category with this name or slug already exists",
      };
      res.status(409).json(response);
      return;
    }

    const response: CategoryFailResponse = {
      status: "error",
      message: "Internal server error while creating category",
    };
    res.status(500).json(response);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const category = req.category as CategoryInstance | undefined;
    if (!category) {
      const response: CategoryFailResponse = {
        status: "error",
        message: "Category not found in request context",
      };
      res.status(500).json(response);
      return;
    }

    const { name, description, slug } = req.body as Record<string, unknown>;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (slug !== undefined) updateData.slug = slug;

    await category.update(updateData);

    const response: CategorySuccessResponse<{ category: CategoryInstance }> = {
      status: "success",
      message: "Category updated successfully",
      data: {
        category,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating category:", error);

    if (
      error instanceof Error &&
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const response: CategoryFailResponse = {
        status: "fail",
        message: "A category with this name or slug already exists",
      };
      res.status(409).json(response);
      return;
    }

    const response: CategoryFailResponse = {
      status: "error",
      message: "Internal server error while updating category",
    };
    res.status(500).json(response);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const category = req.category as CategoryInstance | undefined;

    if (!category) {
      const response: CategoryFailResponse = {
        status: "error",
        message: "Category not found in request context",
      };
      res.status(500).json(response);
      return;
    }

    await category.destroy();

    const response: CategorySuccessResponse<Record<string, never>> = {
      status: "success",
      message: "Category deleted successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting category:", error);
    const response: CategoryFailResponse = {
      status: "error",
      message: "Internal server error while deleting category",
    };
    res.status(500).json(response);
  }
};
