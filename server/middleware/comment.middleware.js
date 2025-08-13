import db from "../models/index.js";
const Comments = db.comments;

// Middleware to check if a comment exists by its ID.
const checkCommentExists = async (req, res, next) => {
  try {
    const comment_id = req.params.comment_id;
    const comment = await Comments.findByPk(comment_id);
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
  const user_id = req.user.user_id;
  const userRole = req.user.role;
  const commentUserId = req.comment.user_id;
  if (userRole === "admin" || user_id === commentUserId) {
    next();
  } else {
    return res.status(403).json({
      status: "fail",
      message: "Access denied: You can only modify your own comments",
    });
  }
};

export { checkCommentExists, checkCommentOwnership };
