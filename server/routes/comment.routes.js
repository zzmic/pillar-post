import express from "express";
const router = express.Router();

import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  validate,
  commentValidationRules,
  commentUpdateValidationRules,
} from "../middleware/validation.middleware.js";
// Comment middleware imports removed - not currently used in routes
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

// Optional authentication middleware for public routes.
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.user_id) {
    req.user = {
      user_id: req.session.user_id,
      role: req.session.role,
    };
  }
  next();
};

// POST /api/comments/posts/:post_id - Create a new comment on a post.
router.post(
  "/posts/:post_id",
  isAuthenticated,
  commentValidationRules(),
  validate,
  createComment
);

// GET /api/comments/posts/:post_id - Get all comments for a post.
router.get("/posts/:post_id", optionalAuth, getCommentsByPost);

// PUT /api/comments/:comment_id - Update a comment.
router.put(
  "/:comment_id",
  isAuthenticated,
  commentUpdateValidationRules(),
  validate,
  updateComment
);

// DELETE /api/comments/:comment_id - Delete a comment.
router.delete("/:comment_id", isAuthenticated, deleteComment);

export default router;
