import { Router, type RequestHandler } from "express";

import { isAuthenticated } from "../middleware/auth.middleware.js";
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
  "/posts/:post_id",
  isAuthenticated,
  commentValidationRules(),
  validate,
  createComment,
);

router.get("/posts/:post_id", optionalAuth, getCommentsByPost);

router.put(
  "/:comment_id",
  isAuthenticated,
  commentUpdateValidationRules(),
  validate,
  updateComment,
);

router.delete("/:comment_id", isAuthenticated, deleteComment);

export default router;
