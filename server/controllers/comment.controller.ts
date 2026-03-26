import type { NextFunction, Request, Response } from "express";

import { sendApiError } from "../utils/api-envelope.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";

type Identifier = number | string;

interface CommentJSON extends Record<string, unknown> {
  comment_id: Identifier;
  parent_comment_id?: Identifier | null;
  replies?: CommentJSON[];
}

interface CommentInstance {
  comment_id: Identifier;
  post_id: Identifier;
  user_id: Identifier;
  parent_comment_id?: Identifier | null;
  body?: string;
  status?: string;
  toJSON: () => CommentJSON;
  update: (values: Record<string, unknown>) => Promise<void>;
  destroy: () => Promise<void>;
}

type PostInstance = Record<string, unknown>;

interface CommentModel {
  findByPk: (
    id: unknown,
    options?: Record<string, unknown>,
  ) => Promise<CommentInstance | null>;
  create: (values: Record<string, unknown>) => Promise<CommentInstance>;
  findAll: (options: Record<string, unknown>) => Promise<CommentInstance[]>;
  count: (options: Record<string, unknown>) => Promise<number>;
}

interface PostModel {
  findByPk: (
    id: unknown,
    options?: Record<string, unknown>,
  ) => Promise<PostInstance | null>;
}

const getComments = (): CommentModel =>
  getSequelizeModel<CommentModel>("comments");

const getPosts = (): PostModel => getSequelizeModel<PostModel>("posts");

const getUsers = (): Record<string, unknown> =>
  getSequelizeModel<Record<string, unknown>>("users");

interface CommentSuccessResponse<T> {
  status: "success";
  message: string;
  data?: T;
}

interface CreateCommentBody {
  commentBody?: string;
  parentCommentId?: Identifier | null;
}

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { commentBody, parentCommentId } = req.body as CreateCommentBody;
    const postId = req.params.post_id;
    const user = req.user;

    if (!user) {
      sendApiError(res, 401, "Authentication required");
      return;
    }

    if (typeof commentBody !== "string" || commentBody.trim().length === 0) {
      sendApiError(res, 400, "Comment body is required");
      return;
    }

    const post = await getPosts().findByPk(postId);
    if (!post) {
      sendApiError(res, 404, "Post not found");
      return;
    }

    if (parentCommentId) {
      const parentComment = await getComments().findByPk(parentCommentId);
      if (!parentComment) {
        sendApiError(res, 404, "Parent comment not found");
        return;
      }

      if (String(parentComment.post_id) !== String(postId)) {
        sendApiError(res, 400, "Parent comment does not belong to this post");
        return;
      }
    }

    const newComment = await getComments().create({
      post_id: postId,
      user_id: user.user_id,
      parent_comment_id: parentCommentId ?? null,
      body: commentBody,
      status: "pending",
    });

    const createdComment = await getComments().findByPk(newComment.comment_id, {
      include: [
        {
          model: getUsers(),
          as: "commenter",
          attributes: ["user_id", "username"],
        },
      ],
    });

    const response: CommentSuccessResponse<CommentInstance | null> = {
      status: "success",
      message: "Comment created and is pending approval",
      data: createdComment ?? undefined,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating comment:", error);
    next(error);
  }
};

const structureComments = (comments: CommentInstance[]): CommentJSON[] => {
  const commentMap = new Map<Identifier, CommentJSON>();
  const rootComments: CommentJSON[] = [];

  comments.forEach((comment) => {
    const commentData: CommentJSON = {
      ...comment.toJSON(),
      comment_id: comment.comment_id,
      parent_comment_id: comment.parent_comment_id ?? null,
      replies: [],
    };
    commentMap.set(comment.comment_id, commentData);
  });

  comments.forEach((comment) => {
    const commentData = commentMap.get(comment.comment_id);
    if (!commentData) {
      return;
    }

    if (comment.parent_comment_id) {
      const parentComment = commentMap.get(comment.parent_comment_id);
      if (parentComment) {
        parentComment.replies = parentComment.replies ?? [];
        parentComment.replies.push(commentData);
      }
    } else {
      rootComments.push(commentData);
    }
  });

  return rootComments;
};

export const getCommentsByPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const postId = req.params.post_id;
    const userRole = req.user?.role ?? null;

    const post = await getPosts().findByPk(postId);
    if (!post) {
      sendApiError(res, 404, "Post not found");
      return;
    }

    const whereConditions: Record<string, unknown> = {
      post_id: postId,
    };

    if (userRole !== "admin") {
      whereConditions.status = "approved";
    }

    const comments = await getComments().findAll({
      where: whereConditions,
      include: [
        {
          model: getUsers(),
          as: "commenter",
          attributes: ["user_id", "username"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    const structuredComments = structureComments(comments);

    const response: CommentSuccessResponse<{
      comments: CommentJSON[];
      total: number;
    }> = {
      status: "success",
      message: "Comments fetched",
      data: {
        comments: structuredComments,
        total: comments.length,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching comments:", error);
    next(error);
  }
};

interface UpdateCommentBody {
  commentBody?: string;
}

export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const commentId = req.params.comment_id;
    const { commentBody } = req.body as UpdateCommentBody;

    const comment = await getComments().findByPk(commentId);
    if (!comment) {
      sendApiError(res, 404, "Comment not found");
      return;
    }

    const user = req.user;
    if (!user) {
      sendApiError(res, 401, "Authentication required");
      return;
    }

    if (
      user.role !== "admin" &&
      String(user.user_id) !== String(comment.user_id)
    ) {
      sendApiError(
        res,
        403,
        "Access denied: You can only update your own comments",
      );
      return;
    }

    await comment.update({
      body: commentBody,
      status: user.role === "admin" ? comment.status : "pending",
    });

    const updatedComment = await getComments().findByPk(commentId, {
      include: [
        {
          model: getUsers(),
          as: "commenter",
          attributes: ["user_id", "username"],
        },
      ],
    });

    const response: CommentSuccessResponse<CommentInstance | null> = {
      status: "success",
      message:
        user.role === "admin"
          ? "Comment updated"
          : "Comment updated and is pending approval",
      data: updatedComment ?? undefined,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating comment:", error);
    next(error);
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const commentId = req.params.comment_id;
    const comment = await getComments().findByPk(commentId);

    if (!comment) {
      sendApiError(res, 404, "Comment not found");
      return;
    }

    const user = req.user;
    if (!user) {
      sendApiError(res, 401, "Authentication required");
      return;
    }

    if (
      user.role !== "admin" &&
      String(user.user_id) !== String(comment.user_id)
    ) {
      sendApiError(
        res,
        403,
        "Access denied: You can only delete your own comments",
      );
      return;
    }

    const repliesCount = await getComments().count({
      where: { parent_comment_id: commentId },
    });

    if (repliesCount > 0) {
      await comment.update({
        body: "[Comment deleted]",
        status: "spam",
      });

      const response: CommentSuccessResponse<Record<string, never>> = {
        status: "success",
        message: "Comment deleted",
      };
      res.status(200).json(response);
      return;
    }

    await comment.destroy();

    const response: CommentSuccessResponse<Record<string, never>> = {
      status: "success",
      message: "Comment deleted",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting comment:", error);
    next(error);
  }
};
