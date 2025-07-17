const express = require("express");
const router = express.Router();

const { isAuthenticated } = require("../middleware/auth.middleware");
const {
  validate,
  commentValidationRules,
  commentUpdateValidationRules,
} = require("../middleware/validation.middleware");
const {
  checkCommentExists,
  checkCommentOwnership,
} = require("../middleware/comment.middleware");

const {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} = require("../controllers/comment.controller");

// Optional authentication middleware for public routes.
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = {
      userId: req.session.userId,
      role: req.session.role,
    };
  }
  next();
};

// POST /api/comments/posts/:postId - Create a new comment on a post.
router.post(
  "/posts/:postId",
  isAuthenticated,
  commentValidationRules(),
  validate,
  createComment
);

// GET /api/comments/posts/:postId - Get all comments for a post.
router.get("/posts/:postId", optionalAuth, getCommentsByPost);

// PUT /api/comments/:commentId - Update a comment.
router.put(
  "/:commentId",
  isAuthenticated,
  commentUpdateValidationRules(),
  validate,
  updateComment
);

// DELETE /api/comments/:commentId - Delete a comment.
router.delete("/:commentId", isAuthenticated, deleteComment);

module.exports = router;
