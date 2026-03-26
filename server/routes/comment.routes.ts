import { Router } from "express";

import {
  isAuthenticated,
  optionalAuthenticate,
} from "../middleware/auth.middleware.js";
import {
  commentUpdateValidationRules,
  commentValidationRules,
  validate,
} from "../middleware/validation.middleware.js";
import {
  createComment,
  deleteComment,
  getCommentsByPost,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.post(
  "/posts/:post_id",
  isAuthenticated,
  commentValidationRules(),
  validate,
  createComment,
);

router.get("/posts/:post_id", optionalAuthenticate, getCommentsByPost);

router.put(
  "/:comment_id",
  isAuthenticated,
  commentUpdateValidationRules(),
  validate,
  updateComment,
);

router.delete("/:comment_id", isAuthenticated, deleteComment);

export default router;
