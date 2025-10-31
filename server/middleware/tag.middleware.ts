import type { NextFunction, Request, Response } from "express";

import db from "../models/index.js";

type Identifier = string | number;

type TagAttributes = Record<string, unknown> & {
  tag_id?: Identifier;
  posts?: Array<Record<string, unknown>>;
};

type TagModel = {
  findByPk: (
    id: unknown,
    options?: Record<string, unknown>,
  ) => Promise<TagAttributes | null>;
  findOne: (options: {
    where: Record<string, unknown>;
  }) => Promise<TagAttributes | null>;
};

type PostsModel = Record<string, unknown>;

interface DbModelMap {
  tags?: unknown;
  posts?: unknown;
}

const models = db as DbModelMap;

const Tags = models.tags as TagModel | undefined;
const Posts = models.posts as PostsModel | undefined;

const assertTagModel = (): TagModel => {
  if (!Tags) {
    throw new Error("Tags model is not available on the database instance.");
  }

  return Tags;
};

const assertPostsModel = (): PostsModel => {
  if (!Posts) {
    throw new Error("Posts model is not available on the database instance.");
  }

  return Posts;
};

type TagRequest = Request & {
  tag?: TagAttributes;
};

export const checkIfTagExistsByID = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tagId = req.params.tag_id as string | undefined;
    const tagModel = assertTagModel();
    const tag = tagId ? await tagModel.findByPk(tagId) : null;

    if (!tag) {
      res.status(404).json({
        status: "fail",
        message: "Tag not found",
      });
      return;
    }

    (req as TagRequest).tag = tag;
    next();
  } catch (error) {
    console.error("Error checking tag existence by ID:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to check tag existence by ID";

    res.status(500).json({
      status: "fail",
      message: "Failed to check tag existence by ID",
      error: message,
    });
  }
};

export const checkIfTagExistsBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const slug = req.params.slug as string | undefined;
    const tagModel = assertTagModel();
    const tag = slug ? await tagModel.findOne({ where: { slug } }) : null;

    if (!tag) {
      res.status(404).json({
        status: "fail",
        message: "Tag not found",
      });
      return;
    }

    (req as TagRequest).tag = tag;
    next();
  } catch (error) {
    console.error("Error checking tag existence by slug:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to check tag existence by slug";

    res.status(500).json({
      status: "fail",
      message: "Failed to check tag existence by slug",
      error: message,
    });
  }
};

export const checkTagPermissions = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      status: "fail",
      message: "Authentication required",
    });
    return;
  }

  if (user.role !== "admin") {
    res.status(403).json({
      status: "fail",
      message: "Admin privileges required to manage tags",
    });
    return;
  }

  next();
};

export const checkTagDependencies = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tagId = req.params.tag_id as string | undefined;
    const tagModel = assertTagModel();
    const postsModel = assertPostsModel();

    const tag = tagId
      ? await tagModel.findByPk(tagId, {
          include: [
            {
              model: postsModel,
              as: "posts",
              through: { attributes: [] }, // Exclude join table attributes.
            },
          ],
        })
      : null;

    if (!tag) {
      res.status(404).json({
        status: "fail",
        message: "Tag not found",
      });
      return;
    }

    if (Array.isArray(tag.posts) && tag.posts.length > 0) {
      res.status(400).json({
        status: "fail",
        message:
          "Cannot delete tag that is associated with posts. Remove tag from all posts first",
      });
      return;
    }

    (req as TagRequest).tag = tag;
    next();
  } catch (error) {
    console.error("Error checking tag dependencies:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to check tag dependencies";

    res.status(500).json({
      status: "fail",
      message: "Failed to check tag dependencies",
      error: message,
    });
  }
};
