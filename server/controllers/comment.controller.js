import db from "../models/index.js";
const Comments = db.comments;
const Users = db.users;
const Posts = db.posts;

// Function to create a new comment on a post.
const createComment = async (req, res, next) => {
  try {
    const { commentBody, parentCommentId } = req.body;
    const { post_id } = req.params;
    const user_id = req.user.user_id;

    // Verify whether the post exists.
    const post = await Posts.findByPk(post_id);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    // If `parentCommentId` is provided, check if it exists and belongs to the post.
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

    // Create the comment (with the default status of "pending").
    const newComment = await Comments.create({
      post_id: post_id,
      user_id: user_id,
      parent_comment_id: parentCommentId || null,
      body: commentBody,
      status: "pending",
    });

    // Fetch the newly created comment with user details.
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
    const { post_id } = req.params;
    const userRole = req.user ? req.user.role : null;

    // Verify whether the post exists.
    const post = await Posts.findByPk(post_id);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    // Build where-conditions based on the user role.
    const whereConditions = {
      post_id: post_id,
    };

    // If the user is not an admin, only fetch approved comments.
    if (userRole !== "admin") {
      whereConditions.status = "approved";
    }

    // Fetch comments with user details.
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
    const { comment_id } = req.params;
    const { commentBody } = req.body;

    // Find the comment.
    const comment = await Comments.findByPk(comment_id);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    // Check the ownership (users can only update their own comments unless they are admins).
    const user_id = req.user.user_id;
    const userRole = req.user.role;
    if (userRole !== "admin" && user_id !== comment.user_id) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied: You can only update your own comments",
      });
    } // Update the comment body and reset status to "pending" if the user is not an admin.
    await comment.update({
      body: commentBody,
      // Reset status to pending if non-admin user edits an approved comment
      status: userRole === "admin" ? comment.status : "pending",
    });

    // Fetch updated comment with user details.
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

// Function to delete a comment.
const deleteComment = async (req, res, next) => {
  try {
    const { comment_id } = req.params;

    // Find the comment.
    const comment = await Comments.findByPk(comment_id);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    // Check the ownership (users can only delete their own comments unless they are admins).
    const user_id = req.user.user_id;
    const userRole = req.user.role;
    if (userRole !== "admin" && user_id !== comment.user_id) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied: You can only delete your own comments",
      });
    }

    // Check if the comment has replies.
    // If it does, delete by updating content and status.
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

export { createComment, getCommentsByPost, updateComment, deleteComment };
