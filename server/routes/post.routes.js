import express from "express";
const router = express.Router();

import { isAuthenticated, isAuthor } from "../middleware/auth.middleware.js";
import {
  validate,
  postValidationRules,
} from "../middleware/validation.middleware.js";
import {
  checkPostOwnership,
  checkPostExists,
  generatePostSlugIfNeeded,
} from "../middleware/post.middleware.js";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";

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

// POST /api/posts - Create a new post.
router.post(
  "/",
  isAuthenticated,
  isAuthor,
  postValidationRules(),
  validate,
  generatePostSlugIfNeeded,
  createPost
);

// GET /api/posts - Get all posts.
router.get("/", getAllPosts);

// GET /api/posts/:post_id - Get a single post.
router.get("/:post_id", optionalAuth, checkPostExists, getPostById);

// PUT /api/posts/:post_id - Update a post.
router.put(
  "/:post_id",
  isAuthenticated,
  checkPostExists,
  checkPostOwnership,
  postValidationRules(),
  validate,
  updatePost
);

// DELETE /api/posts/:post_id - Delete a post.
router.delete(
  "/:post_id",
  isAuthenticated,
  checkPostExists,
  checkPostOwnership,
  deletePost
);

export default router;
