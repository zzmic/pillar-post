import type { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";

import db from "../models/index.js";
import {
  buildPaginatedResponse,
  type PaginatedResponse,
  type PaginationOptions,
  getPaginationOptions,
} from "../utils/pagination.utils.js";
import { ensureUniquePostSlug, generateSlug } from "../utils/slug.utils.js";

type Identifier = number | string;

interface PostInstance extends Record<string, unknown> {
  post_id: Identifier;
  user_id: Identifier;
  status?: string;
  update?: (values: Record<string, unknown>) => Promise<void>;
}

type PostWhereConditions = Record<string, unknown> & {
  [Op.or]?: Array<Record<string, unknown>>;
};

interface PostModel {
  create: (values: Record<string, unknown>) => Promise<PostInstance>;
  findByPk: (
    id: unknown,
    options?: Record<string, unknown>,
  ) => Promise<PostInstance | null>;
  findAndCountAll: (
    options: Record<string, unknown>,
  ) => Promise<{ count: number; rows: PostInstance[] }>;
  update: (
    values: Record<string, unknown>,
    options: Record<string, unknown>,
  ) => Promise<void>;
  destroy: (options: Record<string, unknown>) => Promise<void>;
}

interface DbModelMap {
  posts?: unknown;
  users?: unknown;
  categories?: unknown;
  tags?: unknown;
}

const models = db as DbModelMap;

const getModel = <T>(model: unknown, modelName: string): T => {
  if (
    typeof model !== "object" ||
    model === null ||
    typeof (model as { findAndCountAll?: unknown }).findAndCountAll !==
      "function"
  ) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }

  return model as T;
};

const Posts = getModel<PostModel>(models.posts, "posts");
const ensureReferenceModel = (
  model: unknown,
  modelName: string,
): Record<string, unknown> => {
  if (typeof model !== "object" || model === null) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }

  return model as Record<string, unknown>;
};

const Users = ensureReferenceModel(models.users, "users");
const Categories = ensureReferenceModel(models.categories, "categories");
const Tags = ensureReferenceModel(models.tags, "tags");

interface PostSuccessResponse<T> {
  status: "success";
  message: string;
  data: T;
}

interface PostFailResponse {
  status: "fail" | "error";
  message: string;
}

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, body, slug, status } = req.body as Record<string, unknown>;
    const user = req.user;

    if (!user) {
      const response: PostFailResponse = {
        status: "fail",
        message: "Authentication required",
      };
      res.status(401).json(response);
      return;
    }

    if (typeof title !== "string" || title.trim().length === 0) {
      const response: PostFailResponse = {
        status: "fail",
        message: "Title is required",
      };
      res.status(400).json(response);
      return;
    }

    if (typeof body !== "string" || body.trim().length === 0) {
      const response: PostFailResponse = {
        status: "fail",
        message: "Body is required",
      };
      res.status(400).json(response);
      return;
    }

    const baseSlugSource =
      typeof slug === "string" && slug.trim().length > 0 ? slug : title;
    const normalizedSlug = generateSlug(baseSlugSource);
    const uniqueSlug = await ensureUniquePostSlug(normalizedSlug);

    const newPost = await Posts.create({
      title,
      body,
      slug: uniqueSlug,
      status,
      user_id: user.user_id,
    });

    const createdPost = await Posts.findByPk(newPost.post_id, {
      include: [
        { model: Users, as: "author", attributes: ["user_id", "username"] },
        { model: Categories, as: "categories" },
        { model: Tags, as: "tags" },
      ],
    });

    const response: PostSuccessResponse<{ post: PostInstance | null }> = {
      status: "success",
      message: "Post created successfully",
      data: {
        post: createdPost ?? null,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating post:", error);
    next(error);
  }
};

const parseQueryValue = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return undefined;
};

export const getAllPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const paginationOptions: PaginationOptions = getPaginationOptions(req);
    const category = parseQueryValue(req.query.category);
    const tag = parseQueryValue(req.query.tag);
    const statusFilter = parseQueryValue(req.query.status);
    const search = parseQueryValue(req.query.search);
    const userRole = req.user?.role ?? null;

    const whereConditions: PostWhereConditions = {};
    if (userRole !== "admin") {
      whereConditions.status = "published";
    } else if (statusFilter) {
      whereConditions.status = statusFilter;
    }

    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { body: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const includeArray: Record<string, unknown>[] = [
      { model: Users, as: "author", attributes: ["user_id", "username"] },
      {
        model: Categories,
        as: "categories",
        ...(category ? { where: { slug: category } } : {}),
      },
      {
        model: Tags,
        as: "tags",
        ...(tag ? { where: { slug: tag } } : {}),
      },
    ];

    const { count, rows } = await Posts.findAndCountAll({
      where: whereConditions,
      include: includeArray,
      order: [["created_at", "DESC"]],
      distinct: true,
      ...paginationOptions,
    });

    const response: PaginatedResponse<PostInstance[]> = buildPaginatedResponse(
      rows,
      count,
      paginationOptions,
    );

    const payload: PostSuccessResponse<PaginatedResponse<PostInstance[]>> = {
      status: "success",
      message: "Posts fetched successfully",
      data: response,
    };

    res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching posts:", error);
    next(error);
  }
};

export const getPostById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const postId = req.params.post_id;

    const post = await Posts.findByPk(postId, {
      include: [
        { model: Users, as: "author", attributes: ["user_id", "username"] },
        { model: Categories, as: "categories" },
        { model: Tags, as: "tags" },
      ],
    });

    if (!post) {
      const response: PostFailResponse = {
        status: "fail",
        message: "Post not found",
      };
      res.status(404).json(response);
      return;
    }

    if (post.status === "draft") {
      const user = req.user;
      if (
        !user ||
        (String(post.user_id) !== String(user.user_id) && user.role !== "admin")
      ) {
        const response: PostFailResponse = {
          status: "fail",
          message:
            "Access denied: You do not have permission to view this post",
        };
        res.status(403).json(response);
        return;
      }
    }

    const payload: PostSuccessResponse<{ post: PostInstance | null }> = {
      status: "success",
      message: "Post fetched successfully",
      data: {
        post,
      },
    };

    res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching post:", error);
    next(error);
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const postId = req.params.post_id;
    const { title, body, slug, status } = req.body as Record<string, unknown>;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (body !== undefined) updateData.body = body;
    if (slug !== undefined) updateData.slug = slug;
    if (status !== undefined) updateData.status = status;

    await Posts.update(updateData, { where: { post_id: postId } });

    const updatedPost = await Posts.findByPk(postId, {
      include: [
        { model: Users, as: "author", attributes: ["user_id", "username"] },
        { model: Categories, as: "categories" },
        { model: Tags, as: "tags" },
      ],
    });

    const response: PostSuccessResponse<{ post: PostInstance | null }> = {
      status: "success",
      message: "Post updated successfully",
      data: {
        post: updatedPost ?? null,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating post:", error);
    next(error);
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const postId = req.params.post_id;

    await Posts.destroy({ where: { post_id: postId } });

    const response: PostSuccessResponse<Record<string, never>> = {
      status: "success",
      message: "Post deleted successfully",
      data: {},
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting post:", error);
    next(error);
  }
};
