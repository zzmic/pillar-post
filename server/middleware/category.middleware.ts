import type { NextFunction, Request, Response } from "express";

import db from "../models/index.js";

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

interface DbModelMap {
  categories?: unknown;
  posts?: unknown;
}

const models = db as DbModelMap;

const Category = models.categories as CategoryModel | undefined;
const Posts = models.posts as PostsModel | undefined;

const assertCategoryModel = (): CategoryModel => {
  if (!Category) {
    throw new Error(
      "Category model is not available on the database instance.",
    );
  }
  return Category;
};

const assertPostsModel = (): PostsModel => {
  if (!Posts) {
    throw new Error("Posts model is not available on the database instance.");
  }
  return Posts;
};

type CategoryRequest = Request & {
  category?: CategoryAttributes;
};

const findCategoryById = async (
  categoryId: string | undefined,
): Promise<CategoryAttributes | null> => {
  const categoryModel = assertCategoryModel();
  if (!categoryId) {
    return null;
  }

  return categoryModel.findByPk(categoryId);
};

const findCategoryBySlug = async (
  slug: string | undefined,
): Promise<CategoryAttributes | null> => {
  const categoryModel = assertCategoryModel();
  if (!slug) {
    return null;
  }

  return categoryModel.findOne({ where: { slug } });
};

export const checkIfCategoryExistsByID = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categoryId = req.params.category_id as string | undefined;
    const categoryRequest = req as CategoryRequest;
    const category = await findCategoryById(categoryId);

    if (!category) {
      res.status(404).json({
        status: "fail",
        message: "Category not found",
      });
      return;
    }

    categoryRequest.category = category;
    next();
  } catch (error) {
    console.error("Error checking category existence by ID:", error);

    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        status: "fail",
        message: "Failed to check category existence by ID",
      });
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
      res.status(404).json({
        status: "fail",
        message: "Category not found",
      });
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
    res.status(401).json({
      status: "fail",
      message: "Authentication required: Please sign in",
    });
    return;
  }

  if (user.role !== "admin") {
    res.status(403).json({
      status: "fail",
      message:
        "Access denied: Administrator privileges required for category management",
    });
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
      res.status(400).json({
        status: "fail",
        message: "Category details are missing from the request context",
      });
      return;
    }

    const postsModel = assertPostsModel();

    const postCount = await postsModel.count({
      include: [
        {
          model: assertCategoryModel(),
          as: "categories",
          where: { category_id: category.category_id },
        },
      ],
    });

    if (postCount > 0) {
      res.status(409).json({
        status: "fail",
        message: `Cannot delete category. It is associated with ${String(postCount)} post(s). Please remove the category from all posts before deletion.`,
        data: {
          associatedPosts: postCount,
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error checking category dependencies:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while checking category dependencies",
    });
  }
};
