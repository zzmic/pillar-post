import express from "express";
import {
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  profileUpdateValidationRules,
  validateUserId,
} from "../middleware/validation.middleware.js";

const router = express.Router();

// GET /api/users/:id/profile - Get user profile (public).
router.get("/:id/profile", validateUserId(), getUserProfile);

// PUT /api/users/:id/profile - Update user profile (authenticated users only).
router.put(
  "/:id/profile",
  isAuthenticated,
  validateUserId(),
  profileUpdateValidationRules(),
  updateUserProfile
);

export default router;
