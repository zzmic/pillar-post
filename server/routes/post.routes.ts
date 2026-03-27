import { Router } from "express";

import {
  isAuthenticated,
  isAuthor,
  optionalAuthenticate,
} from "../middleware/auth.middleware.js";
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

router.post(
  "/",
  isAuthenticated,
  isAuthor,
  postValidationRules(),
  validate,
  generatePostSlugIfNeeded,
  createPost,
);

router.get("/", optionalAuthenticate, getAllPosts);

router.get(
  "/:post_id",
  optionalAuthenticate,
  checkIfPostExistsById,
  getPostById,
);

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
