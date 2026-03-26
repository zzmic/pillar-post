import type { NextFunction, Request, Response } from "express";

import { sendApiError } from "../utils/api-envelope.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";

type Identifier = string | number;

type CategoryAttributes = Record<string, unknown> & {
  category_id?: Identifier;
};

type CategoryModel = {
  findByPk: (id: unknown) => Promise<CategoryAttributes | null>;
  findOne: (options: {
    where: Record<string, unknown>;
  }) => Promise<CategoryAttributes | null>;
};

type PostsModel = {
  count: (options?: Record<string, unknown>) => Promise<number>;
};

const getCategoryModel = (): CategoryModel =>
  getSequelizeModel<CategoryModel>("categories");

const getPostsModel = (): PostsModel => getSequelizeModel<PostsModel>("posts");

type CategoryRequest = Request & {
  category?: CategoryAttributes;
};

const findCategoryById = async (
  categoryId: string | undefined,
): Promise<CategoryAttributes | null> => {
  const categoryModel = getCategoryModel();
  if (!categoryId) {
    return null;
  }

  return categoryModel.findByPk(categoryId);
};

const findCategoryBySlug = async (
  slug: string | undefined,
): Promise<CategoryAttributes | null> => {
  const categoryModel = getCategoryModel();
  if (!slug) {
    return null;
  }

  return categoryModel.findOne({ where: { slug } });
};

export const checkIfCategoryExistsById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categoryId = req.params.category_id as string | undefined;
    const categoryRequest = req as CategoryRequest;
    const category = await findCategoryById(categoryId);

    if (!category) {
      sendApiError(res, 404, "Category not found");
      return;
    }

    categoryRequest.category = category;
    next();
  } catch (error) {
    console.error("Error checking category existence by ID:", error);

    if (error instanceof Error && error.name === "CastError") {
      sendApiError(res, 400, "Failed to check category existence by ID");
      return;
    }

    next(error as Error);
  }
};

export const checkIfCategoryExistsBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const slug = req.params.slug as string | undefined;
    const categoryRequest = req as CategoryRequest;
    const category = await findCategoryBySlug(slug);

    if (!category) {
      sendApiError(res, 404, "Category not found");
      return;
    }

    categoryRequest.category = category;
    next();
  } catch (error) {
    console.error("Error checking category existence by slug:", error);
    next(error as Error);
  }
};

export const checkCategoryPermissions = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const user = req.user;

  if (!user) {
    sendApiError(res, 401, "Authentication required: Please sign in");
    return;
  }

  if (user.role !== "admin") {
    sendApiError(
      res,
      403,
      "Access denied: Administrator privileges required for category management",
    );
    return;
  }

  next();
};

export const checkCategoryDependencies = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categoryRequest = req as CategoryRequest;
    const category = categoryRequest.category;
    if (!category?.category_id) {
      sendApiError(
        res,
        400,
        "Category details are missing from the request context",
      );
      return;
    }

    const postsModel = getPostsModel();

    const postCount = await postsModel.count({
      include: [
        {
          model: getCategoryModel(),
          as: "categories",
          where: { category_id: category.category_id },
        },
      ],
    });

    if (postCount > 0) {
      sendApiError(
        res,
        409,
        `Cannot delete category. It is associated with ${String(postCount)} post(s). Please remove the category from all posts before deletion.`,
        {
          data: {
            associatedPosts: postCount,
          },
        },
      );
      return;
    }

    next();
  } catch (error) {
    console.error("Error checking category dependencies:", error);
    sendApiError(
      res,
      500,
      "Internal server error while checking category dependencies",
    );
  }
};
