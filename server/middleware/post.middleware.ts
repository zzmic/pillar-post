import type { NextFunction, Request, RequestHandler, Response } from "express";
import sanitizeHtml from "sanitize-html";

import { sendApiError } from "../utils/api-envelope.js";
import { ensureUniquePostSlug, generateSlug } from "../utils/slug.utils.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";

type Identifier = string | number;

type PostAttributes = Record<string, unknown> & {
  post_id?: Identifier;
  user_id?: Identifier;
};

type PostModel = {
  findByPk: (id: unknown) => Promise<PostAttributes | null>;
  findOne: (options: {
    where: Record<string, unknown>;
  }) => Promise<PostAttributes | null>;
};

const getPostsModel = (): PostModel => getSequelizeModel<PostModel>("posts");

const getAuthenticatedUser = (
  req: Request,
): Express.AuthenticatedUser | null => {
  return req.user ?? null;
};

const toStringIdentifier = (
  value: Identifier | undefined,
): string | undefined => {
  if (typeof value === "number") {
    return value.toString();
  }

  return value;
};

type PostParams = {
  [key: string]: string;
  post_id: string;
};

export const checkPostOwnership: RequestHandler<PostParams> = async (
  req,
  res,
  next,
) => {
  try {
    const postId = req.params.post_id;
    const user = getAuthenticatedUser(req);

    if (!user?.user_id) {
      sendApiError(res, 401, "Unauthorized access: User not authenticated");
      return;
    }

    const postsModel = getPostsModel();
    const post = await postsModel.findByPk(postId);

    if (!post) {
      sendApiError(res, 404, "Post not found");
      return;
    }

    const postOwner = toStringIdentifier(post.user_id);
    const userIdentifier = toStringIdentifier(user.user_id);

    if (postOwner !== userIdentifier && user.role !== "admin") {
      sendApiError(res, 403, "Access denied: You do not own this post");
      return;
    }

    res.post = post;
    res.locals.post = post;
    next();
  } catch (error) {
    console.error("Error in checkPostOwnership middleware:", error);

    if (error instanceof Error && error.name === "CastError") {
      sendApiError(res, 400, "Invalid post ID format");
      return;
    }

    sendApiError(
      res,
      500,
      "Internal server error while checking post existence by ID",
    );
  }
};

export const checkIfPostExistsById: RequestHandler<PostParams> = async (
  req,
  res,
  next,
) => {
  try {
    const postId = req.params.post_id;
    const postsModel = getPostsModel();
    const post = await postsModel.findByPk(postId);

    if (!post) {
      sendApiError(res, 404, "Post not found");
      return;
    }

    res.post = post;
    res.locals.post = post;
    next();
  } catch (error) {
    console.error("Error checking post existence by ID:", error);

    if (error instanceof Error && error.name === "CastError") {
      sendApiError(res, 400, "Failed to check post existence by ID");
      return;
    }

    sendApiError(
      res,
      500,
      "Internal server error while checking post existence by ID",
    );
  }
};

export const generatePostSlugIfNeeded: RequestHandler<PostParams> = async (
  req,
  res,
  next,
) => {
  try {
    const body = req.body as Record<string, unknown>;
    const slugInput = body.slug;
    const title = body.title;
    const postId = req.params.post_id ?? null;

    if (typeof title !== "string" || title.trim().length === 0) {
      sendApiError(res, 400, "Title is required to generate a slug");
      return;
    }

    const providedSlug = typeof slugInput === "string" ? slugInput : undefined;
    const baseSlugSource =
      providedSlug && providedSlug.trim().length > 0 ? providedSlug : title;
    const normalizedSlug = generateSlug(baseSlugSource);

    if (!normalizedSlug) {
      sendApiError(res, 400, "Unable to generate slug from the provided input");
      return;
    }

    const uniqueSlug = await ensureUniquePostSlug(normalizedSlug, postId);

    (req.body as Record<string, unknown>).slug = uniqueSlug;
    next();
  } catch (error) {
    console.error("Error generating post slug if needed:", error);
    sendApiError(
      res,
      500,
      "Internal server error while generating post slug if needed",
    );
  }
};

export const sanitizePostContent = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const body = req.body as Record<string, unknown>;
    const content = body.content;

    if (typeof content === "string" && content.length > 0) {
      const sanitizedContent = sanitizeHtml(content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "img",
          "iframe",
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          iframe: [
            "src",
            "width",
            "height",
            "frameborder",
            "allowfullscreen",
            "sandbox",
          ],
        },
      });

      (req.body as Record<string, unknown>).content = sanitizedContent;
    }

    next();
  } catch (error) {
    console.error("Error sanitizing post content:", error);
    sendApiError(
      res,
      500,
      "Internal server error while sanitizing post content",
    );
  }
};
