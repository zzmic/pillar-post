import type { NextFunction, Request, RequestHandler, Response } from "express";
import sanitizeHtml from "sanitize-html";

import db from "../models/index.js";
import { ensureUniquePostSlug, generateSlug } from "../utils/slug.utils.js";

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

interface DbModelMap {
  posts?: unknown;
}

const models = db as DbModelMap;

const Posts = models.posts as PostModel | undefined;

const assertPostsModel = (): PostModel => {
  if (!Posts) {
    throw new Error("Posts model is not available on the database instance.");
  }

  return Posts;
};

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
      res.status(401).json({
        status: "fail",
        message: "Unauthorized access: User not authenticated",
      });
      return;
    }

    const postsModel = assertPostsModel();
    const post = await postsModel.findByPk(postId);

    if (!post) {
      res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
      return;
    }

    const postOwner = toStringIdentifier(post.user_id);
    const userIdentifier = toStringIdentifier(user.user_id);

    if (postOwner !== userIdentifier && user.role !== "admin") {
      res.status(403).json({
        status: "fail",
        message: "Access denied: You do not own this post",
      });
      return;
    }

    res.post = post;
    res.locals.post = post;
    next();
  } catch (error) {
    console.error("Error in checkPostOwnership middleware:", error);

    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        status: "fail",
        message: "Invalid post ID format",
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error while checking post existence by ID",
    });
  }
};

export const checkIfPostExistsByID: RequestHandler<PostParams> = async (
  req,
  res,
  next,
) => {
  try {
    const postId = req.params.post_id;
    const postsModel = assertPostsModel();
    const post = await postsModel.findByPk(postId);

    if (!post) {
      res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
      return;
    }

    res.post = post;
    res.locals.post = post;
    next();
  } catch (error) {
    console.error("Error checking post existence by ID:", error);

    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        status: "fail",
        message: "Failed to check post existence by ID",
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error while checking post existence by ID",
    });
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
      res.status(400).json({
        status: "fail",
        message: "Title is required to generate a slug",
      });
      return;
    }

    const providedSlug = typeof slugInput === "string" ? slugInput : undefined;
    const baseSlugSource =
      providedSlug && providedSlug.trim().length > 0 ? providedSlug : title;
    const normalizedSlug = generateSlug(baseSlugSource);

    if (!normalizedSlug) {
      res.status(400).json({
        status: "fail",
        message: "Unable to generate slug from the provided input",
      });
      return;
    }

    const uniqueSlug = await ensureUniquePostSlug(normalizedSlug, postId);

    (req.body as Record<string, unknown>).slug = uniqueSlug;
    next();
  } catch (error) {
    console.error("Error generating post slug if needed:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while generating post slug if needed",
    });
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
    res.status(500).json({
      status: "error",
      message: "Internal server error while sanitizing post content",
    });
  }
};
