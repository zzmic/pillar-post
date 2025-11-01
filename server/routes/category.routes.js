import express from "express";
const router = express.Router();

import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  validate,
  categoryValidationRules,
  categoryUpdateValidationRules,
} from "../middleware/validation.middleware.js";
import {
  checkIfCategoryExistsById,
  checkCategoryPermissions,
  checkCategoryDependencies,
  checkIfCategoryExistsBySlug,
} from "../middleware/category.middleware.js";
import {
  validateSlugFormat,
  generateCategorySlugIfNeeded,
} from "../utils/slug.utils.js";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

// POST /api/categories - Create a new category (admin only).
router.post(
  "/",
  isAuthenticated,
  checkCategoryPermissions,
  categoryValidationRules(),
  validate,
  validateSlugFormat,
  generateCategorySlugIfNeeded,
  createCategory,
);

// PUT /api/categories/:category_id - Update an existing category (admin only).
router.put(
  "/:category_id",
  isAuthenticated,
  checkCategoryPermissions,
  checkIfCategoryExistsById,
  checkIfCategoryExistsBySlug,
  categoryUpdateValidationRules(),
  validate,
  generateCategorySlugIfNeeded,
  updateCategory,
);

// DELETE /api/categories/:category_id - Delete a category (admin only).
router.delete(
  "/:category_id",
  isAuthenticated,
  checkCategoryPermissions,
  checkIfCategoryExistsById,
  checkIfCategoryExistsBySlug,
  checkCategoryDependencies,
  deleteCategory,
);

export default router;
