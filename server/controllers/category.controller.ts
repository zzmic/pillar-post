import type { Request, Response } from "express";

import { sendApiError } from "../utils/api-envelope.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";

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

const getCategory = (): CategoryModel =>
  getSequelizeModel<CategoryModel>("categories");

interface CategorySuccessResponse<T> {
  status: "success";
  message: string;
  data?: T;
}

export const createCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, description, slug } = req.body as Record<string, unknown>;

    const category = await getCategory().create({
      name,
      description: description ?? null,
      slug,
    });

    const response: CategorySuccessResponse<{ category: CategoryInstance }> = {
      status: "success",
      message: "Category created",
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
      sendApiError(
        res,
        409,
        "A category with this name or slug already exists",
      );
      return;
    }

    sendApiError(res, 500, "Internal server error while creating category");
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const category = req.category as CategoryInstance | undefined;
    if (!category) {
      sendApiError(res, 500, "Category not found in request context");
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
      message: "Category updated",
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
      sendApiError(
        res,
        409,
        "A category with this name or slug already exists",
      );
      return;
    }

    sendApiError(res, 500, "Internal server error while updating category");
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const category = req.category as CategoryInstance | undefined;

    if (!category) {
      sendApiError(res, 500, "Category not found in request context");
      return;
    }

    await category.destroy();

    const response: CategorySuccessResponse<Record<string, never>> = {
      status: "success",
      message: "Category deleted",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting category:", error);
    sendApiError(res, 500, "Internal server error while deleting category");
  }
};
