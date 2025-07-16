const express = require("express");
const router = express.Router();

const { isAuthenticated, isAuthor } = require("../middleware/auth.middleware");
const {
  validate,
  postValidationRules,
} = require("../middleware/validation.middleware");
const {
  checkPostOwnership,
  checkPostExists,
  generatePostSlugIfNeeded,
} = require("../middleware/post.middleware");

const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
} = require("../controllers/post.controller");

// Optional authentication middleware for public routes.
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = {
      userId: req.session.userId,
      role: req.session.role,
    };
  }
  // Always proceed, whether authenticated or not
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

// GET /api/posts/:id - Get a single post.
router.get("/:id", optionalAuth, checkPostExists, getPostById);

// PUT /api/posts/:id - Update a post.
router.put(
  "/:id",
  isAuthenticated,
  checkPostExists,
  checkPostOwnership,
  postValidationRules(),
  validate,
  updatePost
);

// DELETE /api/posts/:id - Delete a post.
router.delete(
  "/:id",
  isAuthenticated,
  checkPostExists,
  checkPostOwnership,
  deletePost
);

module.exports = router;
