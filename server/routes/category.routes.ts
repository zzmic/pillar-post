import { Router } from "express";

import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  categoryUpdateValidationRules,
  categoryValidationRules,
  validate,
} from "../middleware/validation.middleware.js";
import {
  checkCategoryDependencies,
  checkCategoryPermissions,
  checkIfCategoryExistsById,
  checkIfCategoryExistsBySlug,
} from "../middleware/category.middleware.js";
import {
  generateCategorySlugIfNeeded,
  validateSlugFormat,
} from "../utils/slug.utils.js";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "../controllers/category.controller.js";

const router = Router();

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
