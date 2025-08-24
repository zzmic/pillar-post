import express from "express";
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

const router = express.Router();

// GET /api/users/:id/profile - Get user profile (public).
router.get("/:id/profile", validateUserId, getUserProfile);

// PUT /api/users/:id/profile - Update user profile (authenticated users only).
router.put(
  "/:id/profile",
  isAuthenticated,
  validateUserId,
  canUpdateProfile,
  profileUpdateValidationRules(),
  validate,
  updateUserProfile
);

export default router;
