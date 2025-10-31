import type { NextFunction, Request, Response } from "express";

import db from "../models/index.js";

type Identifier = string | number;

type CommentAttributes = Record<string, unknown> & {
  comment_id?: Identifier;
  user_id?: Identifier;
};

type CommentModel = {
  findByPk: (id: unknown) => Promise<CommentAttributes | null>;
};

interface DbModelMap {
  comments?: unknown;
}

const models = db as DbModelMap;

const Comments = models.comments as CommentModel | undefined;

const assertCommentsModel = (): CommentModel => {
  if (!Comments) {
    throw new Error(
      "Comments model is not available on the database instance.",
    );
  }

  return Comments;
};

type CommentRequest = Request & {
  comment?: CommentAttributes;
};

export const checkIfCommentExists = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const commentId = req.params.comment_id as string | undefined;
    const commentsModel = assertCommentsModel();

    const comment = commentId ? await commentsModel.findByPk(commentId) : null;

    if (!comment) {
      res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
      return;
    }

    (req as CommentRequest).comment = comment;
    next();
  } catch (error) {
    console.error("Error checking comment existence:", error);
    next(error as Error);
  }
};

export const checkCommentOwnership = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const user = req.user;
  const comment = (req as CommentRequest).comment;

  if (!user) {
    res.status(401).json({
      status: "fail",
      message: "Authentication required",
    });
    return;
  }

  if (!comment) {
    res.status(400).json({
      status: "fail",
      message: "Comment details are missing from the request context",
    });
    return;
  }

  if (user.role === "admin" || user.user_id === comment.user_id) {
    next();
    return;
  }

  res.status(403).json({
    status: "fail",
    message: "Access denied: You can only modify your own comments",
  });
};
