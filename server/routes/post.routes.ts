import { Router, type RequestHandler } from "express";

import { isAuthenticated, isAuthor } from "../middleware/auth.middleware.js";
import {
  postValidationRules,
  validate,
} from "../middleware/validation.middleware.js";
import {
  checkIfPostExistsById,
  checkPostOwnership,
  generatePostSlugIfNeeded,
} from "../middleware/post.middleware.js";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  updatePost,
} from "../controllers/post.controller.js";

const router = Router();

const optionalAuth: RequestHandler = (req, _res, next) => {
  if (req.session?.user_id) {
    req.user = {
      user_id: req.session.user_id,
      role: req.session.role,
    };
  }
  next();
};

router.post(
  "/",
  isAuthenticated,
  isAuthor,
  postValidationRules(),
  validate,
  generatePostSlugIfNeeded,
  createPost,
);

router.get("/", getAllPosts);

router.get("/:post_id", optionalAuth, checkIfPostExistsById, getPostById);

router.put(
  "/:post_id",
  isAuthenticated,
  checkIfPostExistsById,
  checkPostOwnership,
  postValidationRules(),
  validate,
  updatePost,
);

router.delete(
  "/:post_id",
  isAuthenticated,
  checkIfPostExistsById,
  checkPostOwnership,
  deletePost,
);

export default router;
