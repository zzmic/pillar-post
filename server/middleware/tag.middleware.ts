import type { NextFunction, Request, Response } from "express";

import { sendApiError } from "../utils/api-envelope.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";

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

const getTagModel = (): TagModel => getSequelizeModel<TagModel>("tags");

const getPostsModel = (): Record<string, unknown> =>
  getSequelizeModel<Record<string, unknown>>("posts");

type TagRequest = Request & {
  tag?: TagAttributes;
};

export const checkIfTagExistsById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tagId = req.params.tag_id as string | undefined;
    const tagModel = getTagModel();
    const tag = tagId ? await tagModel.findByPk(tagId) : null;

    if (!tag) {
      sendApiError(res, 404, "Tag not found");
      return;
    }

    (req as TagRequest).tag = tag;
    next();
  } catch (error) {
    console.error("Error checking tag existence by ID:", error);
    sendApiError(res, 500, "Failed to check tag existence by ID");
  }
};

export const checkIfTagExistsBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const slug = req.params.slug as string | undefined;
    const tagModel = getTagModel();
    const tag = slug ? await tagModel.findOne({ where: { slug } }) : null;

    if (!tag) {
      sendApiError(res, 404, "Tag not found");
      return;
    }

    (req as TagRequest).tag = tag;
    next();
  } catch (error) {
    console.error("Error checking tag existence by slug:", error);
    sendApiError(res, 500, "Failed to check tag existence by slug");
  }
};

export const checkTagPermissions = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const user = req.user;

  if (!user) {
    sendApiError(res, 401, "Authentication required");
    return;
  }

  if (user.role !== "admin") {
    sendApiError(res, 403, "Admin privileges required to manage tags");
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
    const tagModel = getTagModel();
    const postsModel = getPostsModel();

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
      sendApiError(res, 404, "Tag not found");
      return;
    }

    if (Array.isArray(tag.posts) && tag.posts.length > 0) {
      sendApiError(
        res,
        400,
        "Cannot delete tag that is associated with posts. Remove tag from all posts first",
      );
      return;
    }

    (req as TagRequest).tag = tag;
    next();
  } catch (error) {
    console.error("Error checking tag dependencies:", error);
    sendApiError(res, 500, "Failed to check tag dependencies");
  }
};
