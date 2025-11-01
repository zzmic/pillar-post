import { Router } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

import {
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  profileUpdateValidationRules,
  validate,
} from "../middleware/validation.middleware.js";
import {
  canUpdateProfile,
  validateUserId,
} from "../middleware/user.middleware.js";

const router = Router();

type UserParams = ParamsDictionary & { id: string };

router.get<UserParams>("/:id/profile", validateUserId, getUserProfile);

router.put<UserParams>(
  "/:id/profile",
  isAuthenticated,
  validateUserId,
  canUpdateProfile,
  profileUpdateValidationRules(),
  validate,
  updateUserProfile,
);

export default router;
