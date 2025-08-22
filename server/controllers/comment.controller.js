import db from "../models/index.js";
const Comments = db.comments;
const Users = db.users;
const Posts = db.posts;

/**
 * Create a new comment on a post.
 * @route POST /api/posts/:post_id/comments
 * @access Private (Author and Admin only)
 */
const createComment = async (req, res, next) => {
  try {
    const { commentBody, parentCommentId } = req.body;
    const { post_id } = req.params;
    const user_id = req.user.user_id;

    const post = await Posts.findByPk(post_id);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    if (parentCommentId) {
      const parentComment = await Comments.findByPk(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          status: "fail",
          message: "Parent comment not found",
        });
      }
      if (parentComment.post_id !== parseInt(post_id)) {
        return res.status(400).json({
          status: "fail",
          message: "Parent comment does not belong to this post",
        });
      }
    }

    const newComment = await Comments.create({
      post_id: post_id,
      user_id: user_id,
      parent_comment_id: parentCommentId || null,
      body: commentBody,
      status: "pending",
    });

    const createdComment = await Comments.findByPk(newComment.comment_id, {
      include: [
        {
          model: Users,
          as: "commenter",
          attributes: ["user_id", "username"],
        },
      ],
    });

    res.status(201).json({
      status: "success",
      message: "Comment created successfully and is pending approval",
      data: createdComment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    next(error);
  }
};

/**
 * Helper function to structure comments with nested replies.
 * @param {Object[]} comments - The comments to structure.
 * @returns {Object[]} The structured comments.
 */
const structureComments = (comments) => {
  const commentMap = new Map();
  const rootComments = [];

  comments.forEach((comment) => {
    const commentData = {
      ...comment.toJSON(),
      replies: [],
    };
    commentMap.set(comment.comment_id, commentData);
  });

  comments.forEach((comment) => {
    const commentData = commentMap.get(comment.comment_id);
    if (comment.parent_comment_id) {
      const parentComment = commentMap.get(comment.parent_comment_id);
      if (parentComment) {
        parentComment.replies.push(commentData);
      }
    } else {
      rootComments.push(commentData);
    }
  });

  return rootComments;
};

/**
 * Get all comments for a post, including nested replies.
 * @route GET /api/posts/:post_id/comments
 * @access Public
 */
const getCommentsByPost = async (req, res, next) => {
  try {
    const { post_id } = req.params;
    const userRole = req.user ? req.user.role : null;

    const post = await Posts.findByPk(post_id);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    const whereConditions = {
      post_id: post_id,
    };

    if (userRole !== "admin") {
      whereConditions.status = "approved";
    }

    const comments = await Comments.findAll({
      where: whereConditions,
      include: [
        {
          model: Users,
          as: "commenter",
          attributes: ["user_id", "username"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    const structuredComments = structureComments(comments);

    res.status(200).json({
      status: "success",
      message: "Comments fetched successfully",
      data: {
        comments: structuredComments,
        total: comments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    next(error);
  }
};

/**
 * Update a comment.
 * @route PUT /api/comments/:comment_id
 * @access Private (Author and Admin only)
 */
const updateComment = async (req, res, next) => {
  try {
    const { comment_id } = req.params;
    const { commentBody } = req.body;

    const comment = await Comments.findByPk(comment_id);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    const user_id = req.user.user_id;
    const userRole = req.user.role;
    if (userRole !== "admin" && user_id !== comment.user_id) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied: You can only update your own comments",
      });
    }
    await comment.update({
      body: commentBody,
      status: userRole === "admin" ? comment.status : "pending",
    });

    const updatedComment = await Comments.findByPk(comment_id, {
      include: [
        {
          model: Users,
          as: "commenter",
          attributes: ["user_id", "username"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      message:
        userRole === "admin"
          ? "Comment updated successfully"
          : "Comment updated and is pending approval",
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    next(error);
  }
};

/**
 * Delete a comment.
 * @route DELETE /api/comments/:comment_id
 * @access Private (Author and Admin only)
 */
const deleteComment = async (req, res, next) => {
  try {
    const { comment_id } = req.params;

    const comment = await Comments.findByPk(comment_id);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    const user_id = req.user.user_id;
    const userRole = req.user.role;
    if (userRole !== "admin" && user_id !== comment.user_id) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied: You can only delete your own comments",
      });
    }

    const repliesCount = await Comments.count({
      where: { parent_comment_id: comment_id },
    });
    if (repliesCount > 0) {
      await comment.update({
        body: "[Comment deleted]",
        status: "spam",
      });

      return res.status(200).json({
        status: "success",
        message: "Comment deleted successfully",
      });
    }

    await comment.destroy();

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    next(error);
  }
};

export { createComment, getCommentsByPost, updateComment, deleteComment };
