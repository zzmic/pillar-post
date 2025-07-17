const db = require("../models");
const Comment = db.comments;

// Middleware to check if a comment exists by its ID.
const checkCommentExists = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }
    req.comment = comment;
    next();
  } catch (err) {
    console.error("Error checking comment existence:", err);
    next(err);
  }
};

// Middleware to check if the authenticated user owns the comment.
const checkCommentOwnership = (req, res, next) => {
  const userId = req.user.userId;
  const userRole = req.user.role;
  const commentUserId = req.comment.user_id;
  if (userRole === "admin" || userId === commentUserId) {
    next();
  } else {
    return res.status(403).json({
      status: "fail",
      message: "Access denied: You can only modify your own comments",
    });
  }
};

module.exports = {
  checkCommentExists,
  checkCommentOwnership,
};
