import type { NextFunction, Request, Response } from "express";

import db from "../models/index.js";

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

const getModel = <T>(model: unknown, modelName: string): T => {
  if (
    (typeof model !== "object" && typeof model !== "function") ||
    model === null ||
    typeof (model as { findByPk?: unknown }).findByPk !== "function"
  ) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }

  return model as T;
};

const getComments = (): CommentModel => {
  const commentsModel =
    db.sequelize?.models?.comments || (db as Record<string, unknown>).comments;
  return getModel<CommentModel>(commentsModel, "comments");
};

const getPosts = (): PostModel => {
  const postsModel =
    db.sequelize?.models?.posts || (db as Record<string, unknown>).posts;
  return getModel<PostModel>(postsModel, "posts");
};

const ensureReferenceModel = (
  model: unknown,
  modelName: string,
): Record<string, unknown> => {
  if (
    (typeof model !== "object" && typeof model !== "function") ||
    model === null
  ) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }

  return model as Record<string, unknown>;
};

const getUsers = (): Record<string, unknown> => {
  const usersModel =
    db.sequelize?.models?.users || (db as Record<string, unknown>).users;
  return ensureReferenceModel(usersModel, "users");
};

interface CommentSuccessResponse<T> {
  status: "success";
  message: string;
  data?: T;
}

interface CommentFailResponse {
  status: "fail" | "error";
  message: string;
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
      const response: CommentFailResponse = {
        status: "fail",
        message: "Authentication required",
      };
      res.status(401).json(response);
      return;
    }

    if (typeof commentBody !== "string" || commentBody.trim().length === 0) {
      const response: CommentFailResponse = {
        status: "fail",
        message: "Comment body is required",
      };
      res.status(400).json(response);
      return;
    }

    const post = await getPosts().findByPk(postId);
    if (!post) {
      const response: CommentFailResponse = {
        status: "fail",
        message: "Post not found",
      };
      res.status(404).json(response);
      return;
    }

    if (parentCommentId) {
      const parentComment = await getComments().findByPk(parentCommentId);
      if (!parentComment) {
        const response: CommentFailResponse = {
          status: "fail",
          message: "Parent comment not found",
        };
        res.status(404).json(response);
        return;
      }

      if (String(parentComment.post_id) !== String(postId)) {
        const response: CommentFailResponse = {
          status: "fail",
          message: "Parent comment does not belong to this post",
        };
        res.status(400).json(response);
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
      message: "Comment created successfully and is pending approval",
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
      const response: CommentFailResponse = {
        status: "fail",
        message: "Post not found",
      };
      res.status(404).json(response);
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
      message: "Comments fetched successfully",
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
      const response: CommentFailResponse = {
        status: "fail",
        message: "Comment not found",
      };
      res.status(404).json(response);
      return;
    }

    const user = req.user;
    if (!user) {
      const response: CommentFailResponse = {
        status: "fail",
        message: "Authentication required",
      };
      res.status(401).json(response);
      return;
    }

    if (
      user.role !== "admin" &&
      String(user.user_id) !== String(comment.user_id)
    ) {
      const response: CommentFailResponse = {
        status: "fail",
        message: "Access denied: You can only update your own comments",
      };
      res.status(403).json(response);
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
          ? "Comment updated successfully"
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
      const response: CommentFailResponse = {
        status: "fail",
        message: "Comment not found",
      };
      res.status(404).json(response);
      return;
    }

    const user = req.user;
    if (!user) {
      const response: CommentFailResponse = {
        status: "fail",
        message: "Authentication required",
      };
      res.status(401).json(response);
      return;
    }

    if (
      user.role !== "admin" &&
      String(user.user_id) !== String(comment.user_id)
    ) {
      const response: CommentFailResponse = {
        status: "fail",
        message: "Access denied: You can only delete your own comments",
      };
      res.status(403).json(response);
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
        message: "Comment deleted successfully",
      };
      res.status(200).json(response);
      return;
    }

    await comment.destroy();

    const response: CommentSuccessResponse<Record<string, never>> = {
      status: "success",
      message: "Comment deleted successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting comment:", error);
    next(error);
  }
};
