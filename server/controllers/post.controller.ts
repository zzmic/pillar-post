import type { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";

import {
  buildPaginatedResponse,
  type PaginatedResponse,
  type PaginationOptions,
  getPaginationOptions,
} from "../utils/pagination.utils.js";
import { sendApiError } from "../utils/api-envelope.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";
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

const getPosts = (): PostModel => getSequelizeModel<PostModel>("posts");

const getUsers = (): Record<string, unknown> =>
  getSequelizeModel<Record<string, unknown>>("users");

const getCategories = (): Record<string, unknown> =>
  getSequelizeModel<Record<string, unknown>>("categories");

const getTags = (): Record<string, unknown> =>
  getSequelizeModel<Record<string, unknown>>("tags");

interface PostSuccessResponse<T> {
  status: "success";
  message: string;
  data: T;
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
      sendApiError(res, 401, "Authentication required");
      return;
    }

    if (typeof title !== "string" || title.trim().length === 0) {
      sendApiError(res, 400, "Title is required");
      return;
    }

    if (typeof body !== "string" || body.trim().length === 0) {
      sendApiError(res, 400, "Body is required");
      return;
    }

    const baseSlugSource =
      typeof slug === "string" && slug.trim().length > 0 ? slug : title;
    const normalizedSlug = generateSlug(baseSlugSource);
    const uniqueSlug = await ensureUniquePostSlug(normalizedSlug);

    const newPost = await getPosts().create({
      title,
      body,
      slug: uniqueSlug,
      status,
      user_id: user.user_id,
    });

    const createdPost = await getPosts().findByPk(newPost.post_id, {
      include: [
        {
          model: getUsers(),
          as: "author",
          attributes: ["user_id", "username"],
        },
        {
          model: getCategories(),
          as: "categories",
          through: { attributes: [] }, // Exclude join table attributes.
        },
        {
          model: getTags(),
          as: "tags",
          through: { attributes: [] }, // Exclude join table attributes.
        },
      ],
    });

    const response: PostSuccessResponse<{ post: PostInstance | null }> = {
      status: "success",
      message: "Post created",
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
      { model: getUsers(), as: "author", attributes: ["user_id", "username"] },
      {
        model: getCategories(),
        as: "categories",
        through: { attributes: [] }, // Exclude join table attributes.
        ...(category ? { where: { slug: category } } : {}),
      },
      {
        model: getTags(),
        as: "tags",
        through: { attributes: [] }, // Exclude join table attributes.
        ...(tag ? { where: { slug: tag } } : {}),
      },
    ];

    const { count, rows } = await getPosts().findAndCountAll({
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
      message: "Posts fetched",
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

    const post = await getPosts().findByPk(postId, {
      include: [
        {
          model: getUsers(),
          as: "author",
          attributes: ["user_id", "username"],
        },
        {
          model: getCategories(),
          as: "categories",
          through: { attributes: [] }, // Exclude join table attributes.
        },
        {
          model: getTags(),
          as: "tags",
          through: { attributes: [] }, // Exclude join table attributes.
        },
      ],
    });

    if (!post) {
      sendApiError(res, 404, "Post not found");
      return;
    }

    if (post.status === "draft") {
      const user = req.user;
      if (
        !user ||
        (String(post.user_id) !== String(user.user_id) && user.role !== "admin")
      ) {
        sendApiError(
          res,
          403,
          "Access denied: You do not have permission to view this post",
        );
        return;
      }
    }

    const payload: PostSuccessResponse<{ post: PostInstance | null }> = {
      status: "success",
      message: "Post fetched",
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

    await getPosts().update(updateData, { where: { post_id: postId } });

    const updatedPost = await getPosts().findByPk(postId, {
      include: [
        {
          model: getUsers(),
          as: "author",
          attributes: ["user_id", "username"],
        },
        {
          model: getCategories(),
          as: "categories",
          through: { attributes: [] }, // Exclude join table attributes.
        },
        {
          model: getTags(),
          as: "tags",
          through: { attributes: [] }, // Exclude join table attributes.
        },
      ],
    });

    const response: PostSuccessResponse<{ post: PostInstance | null }> = {
      status: "success",
      message: "Post updated",
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

    await getPosts().destroy({ where: { post_id: postId } });

    const response: PostSuccessResponse<Record<string, never>> = {
      status: "success",
      message: "Post deleted",
      data: {},
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting post:", error);
    next(error);
  }
};
