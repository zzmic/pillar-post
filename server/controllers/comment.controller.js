const { body } = require("express-validator");
const db = require("../models");
const Comment = db.comments;
const User = db.users;
const Post = db.posts;

// Function to create a new comment on a post.
const createComment = async (req, res, next) => {
  try {
    const { comment_body, parent_comment_id } = req.body;
    const { postId } = req.params;
    const userId = req.user.userId;

    // Verify whether the post exists.
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    // If `parent_comment_id` is provided, check if it exists and belongs to the post.
    if (parent_comment_id) {
      const parentComment = await Comment.findByPk(parent_comment_id);
      if (!parentComment) {
        return res.status(404).json({
          status: "fail",
          message: "Parent comment not found",
        });
      }
      if (parentComment.post_id !== parseInt(postId)) {
        return res.status(400).json({
          status: "fail",
          message: "Parent comment does not belong to this post",
        });
      }
    }

    // Create the comment (with the default status of "pending").
    const newComment = await Comment.create({
      post_id: postId,
      user_id: userId,
      parent_comment_id: parent_comment_id || null,
      body: comment_body,
      status: "pending",
    });

    // Fetch the newly created comment with user details.
    const createdComment = await Comment.findByPk(newComment.comment_id, {
      include: [
        {
          model: User,
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

// Helper function to structure comments with nested replies.
const structureComments = (comments) => {
  const commentMap = new Map();
  const rootComments = [];

  // Create a map of all comments.
  comments.forEach((comment) => {
    const commentData = {
      ...comment.toJSON(),
      replies: [],
    };
    commentMap.set(comment.comment_id, commentData);
  });

  // Organize comments into a tree structure.
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

// Function to get all comments for a post, including nested replies.
const getCommentsByPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userRole = req.user ? req.user.role : null;

    // Verify whether the post exists.
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    // Build where-conditions based on the user role.
    const whereConditions = {
      post_id: postId,
    };

    // If the user is not an admin, only fetch approved comments.
    if (userRole !== "admin") {
      whereConditions.status = "approved";
    }

    // Fetch comments with user details.
    const comments = await Comment.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "commenter",
          attributes: ["user_id", "username"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    // Structure the comments to demonstrate nested replies.
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

// Function to update a comment.
const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { comment_body } = req.body;

    // Find the comment.
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    // Check the ownership (users can only update their own comments unless they are admins).
    const userId = req.user.userId;
    const userRole = req.user.role;
    if (userRole !== "admin" && userId !== comment.user_id) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied: You can only update your own comments",
      });
    }

    // Update the comment body and reset status to "pending" if the user is not an admin.
    await comment.update({
      body: comment_body,
      // Reset status to pending if non-admin user edits an approved comment
      status: userRole === "admin" ? comment.status : "pending",
    });

    // Fetch updated comment with user details.
    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
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

// Function to delete a comment.
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    // Find the comment.
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    // Check the ownership (users can only delete their own comments unless they are admins).
    const userId = req.user.userId;
    const userRole = req.user.role;
    if (userRole !== "admin" && userId !== comment.user_id) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied: You can only delete your own comments",
      });
    }

    // Check if the comment has replies.
    // If it does, delete by updating content and status.
    const repliesCount = await Comment.count({
      where: { parent_comment_id: commentId },
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

    // Delete the comment.
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

module.exports = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};
