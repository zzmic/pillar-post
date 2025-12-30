import type { NextFunction, Request, RequestHandler, Response } from "express";
import { Op } from "sequelize";

import db from "../models/index.js";

const assertNonEmptyString = (value: unknown, errorMessage: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(errorMessage);
  }

  return value;
};

type WhereClause = Record<string, unknown>;

interface SlugModel {
  findOne: (options: {
    where: WhereClause;
  }) => Promise<Record<string, unknown> | null>;
}

interface DbModelMap {
  posts?: unknown;
  categories?: unknown;
  tags?: unknown;
}

const models = db as DbModelMap;

const getModel = (model: unknown, modelName: string): SlugModel => {
  if (
    typeof model !== "object" ||
    model === null ||
    typeof (model as { findOne?: unknown }).findOne !== "function"
  ) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }

  return model as SlugModel;
};

// Lazy getters for models to handle async model initialization
const getPosts = (): SlugModel => getModel(models.posts, "posts");
const getCategories = (): SlugModel =>
  getModel(models.categories, "categories");
const getTags = (): SlugModel => getModel(models.tags, "tags");

export const generateSlug = (titleInput: unknown): string => {
  const title = assertNonEmptyString(
    titleInput,
    "Invalid title provided for slug generation: it must be a non-empty string.",
  );

  return title
    .normalize("NFD") // Normalize Unicode characters to decompose combined characters.
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics.
    .toLowerCase() // Convert to lowercase.
    .trim() // Trim leading/trailing whitespace.
    .replace(/\s+/g, "-") // Replace spaces with hyphens.
    .replace(/[^\p{L}\p{N}-]+/gu, "") // Remove all non-letter/number characters (Unicode-safe).
    .replace(/--+/g, "-") // Collapse multiple hyphens.
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens.
};

export const ensureUniquePostSlug = async (
  slugInput: unknown,
  postId: string | number | null = null,
): Promise<string> => {
  const baseSlug = assertNonEmptyString(
    slugInput,
    "Invalid slug provided for uniqueness check: it must be a non-empty string.",
  );

  let uniqueSlug = baseSlug;
  let count = 0;
  let isUnique = false;

  while (!isUnique) {
    try {
      const where: WhereClause = { slug: uniqueSlug };

      if (postId !== null && postId !== undefined) {
        where.post_id = { [Op.ne]: postId };
      }

      const existingPost = await getPosts().findOne({ where });

      if (!existingPost) {
        isUnique = true;
      } else {
        count++;
        uniqueSlug = `${baseSlug}-${count}`;
      }
    } catch {
      throw new Error("Error checking slug uniqueness.");
    }
  }

  return uniqueSlug;
};

export const ensureUniqueCategorySlug = async (
  baseSlugInput: string,
  excludeId: string | number | null = null,
): Promise<string> => {
  const baseSlug = assertNonEmptyString(
    baseSlugInput,
    "Invalid slug provided for uniqueness check: it must be a non-empty string.",
  );

  let uniqueSlug = baseSlug;
  let counter = 0;
  let isUnique = false;

  while (!isUnique) {
    const whereClause: WhereClause = { slug: uniqueSlug };

    if (excludeId !== null && excludeId !== undefined) {
      whereClause.category_id = { [Op.ne]: excludeId };
    }

    const existingCategory = await getCategories().findOne({
      where: whereClause,
    });

    if (!existingCategory) {
      isUnique = true;
    } else {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }
  }

  return uniqueSlug;
};

export const ensureUniqueTagSlug = async (
  slugInput: unknown,
  tagId: string | number | null = null,
): Promise<string> => {
  const baseSlug = assertNonEmptyString(
    slugInput,
    "Invalid slug provided for uniqueness check: it must be a non-empty string.",
  );

  let uniqueSlug = baseSlug;
  let count = 0;
  let isUnique = false;

  while (!isUnique) {
    try {
      const where: WhereClause = { slug: uniqueSlug };

      if (tagId !== null && tagId !== undefined) {
        where.tag_id = { [Op.ne]: tagId };
      }

      const existingTag = await getTags().findOne({ where });

      if (!existingTag) {
        isUnique = true;
      } else {
        count++;
        uniqueSlug = `${baseSlug}-${count}`;
      }
    } catch {
      throw new Error("Error checking slug uniqueness.");
    }
  }

  return uniqueSlug;
};

interface SlugRequestBody extends Record<string, unknown> {
  name?: unknown;
  slug?: unknown;
}

export const validateSlugFormat = (
  req: Request<unknown, unknown, SlugRequestBody>,
  res: Response,
  next: NextFunction,
): void => {
  const slugValue = req.body.slug;

  if (slugValue) {
    const slugString = String(slugValue);
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!slugPattern.test(slugString)) {
      res.status(400).json({
        status: "fail",
        message:
          "Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.",
      });
      return;
    }

    if (slugString.length < 1 || slugString.length > 100) {
      res.status(400).json({
        status: "fail",
        message: "Slug must be between 1 and 100 characters long.",
      });
      return;
    }
  }

  next();
};

type CategoryParams = { category_id?: string };
type TagParams = { tag_id?: string };

export const generateCategorySlugIfNeeded: RequestHandler<
  CategoryParams,
  unknown,
  SlugRequestBody
> = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    const categoryId = req.params.category_id ?? null;

    const providedName = typeof name === "string" ? name : undefined;
    const providedSlug = typeof slug === "string" ? slug : undefined;

    if (!providedName && !providedSlug) {
      next();
      return;
    }

    let finalSlug = providedSlug ?? generateSlug(providedName);
    finalSlug = await ensureUniqueCategorySlug(finalSlug, categoryId);

    req.body.slug = finalSlug;
    next();
  } catch (error) {
    console.error("Error generating category slug if needed:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while generating category slug if needed",
    });
  }
};

export const generateTagSlugIfNeeded: RequestHandler<
  TagParams,
  unknown,
  SlugRequestBody
> = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    const tagId = req.params.tag_id ?? null;

    const providedName = typeof name === "string" ? name : undefined;
    const providedSlug = typeof slug === "string" ? slug : undefined;

    if (!providedName && !providedSlug) {
      next();
      return;
    }

    let finalSlug = providedSlug ?? generateSlug(providedName);
    finalSlug = await ensureUniqueTagSlug(finalSlug, tagId);

    req.body.slug = finalSlug;
    next();
  } catch (error) {
    console.error("Error generating tag slug if needed:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while generating tag slug if needed",
    });
  }
};
