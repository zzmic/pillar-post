import type { NextFunction, Request, Response } from "express";

import { sendApiError } from "../utils/api-envelope.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";

type Identifier = string | number;

type CommentAttributes = Record<string, unknown> & {
  comment_id?: Identifier;
  user_id?: Identifier;
};

type CommentModel = {
  findByPk: (id: unknown) => Promise<CommentAttributes | null>;
};

const getCommentsModel = (): CommentModel =>
  getSequelizeModel<CommentModel>("comments");

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
    const commentsModel = getCommentsModel();

    const comment = commentId ? await commentsModel.findByPk(commentId) : null;

    if (!comment) {
      sendApiError(res, 404, "Comment not found");
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
    sendApiError(res, 401, "Authentication required");
    return;
  }

  if (!comment) {
    sendApiError(
      res,
      400,
      "Comment details are missing from the request context",
    );
    return;
  }

  if (user.role === "admin" || user.user_id === comment.user_id) {
    next();
    return;
  }

  sendApiError(
    res,
    403,
    "Access denied: You can only modify your own comments",
  );
};
