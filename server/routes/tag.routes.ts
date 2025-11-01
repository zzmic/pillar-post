import { Router } from "express";

import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  tagUpdateValidationRules,
  tagValidationRules,
  validate,
} from "../middleware/validation.middleware.js";
import {
  checkIfTagExistsById,
  checkIfTagExistsBySlug,
  checkTagDependencies,
  checkTagPermissions,
} from "../middleware/tag.middleware.js";
import {
  generateTagSlugIfNeeded,
  validateSlugFormat,
} from "../utils/slug.utils.js";
import {
  createTag,
  deleteTag,
  getAllTags,
  getTagByID,
  getTagBySlug,
  updateTag,
} from "../controllers/tag.controller.js";

const router = Router();

router.get("/", getAllTags);

router.get("/:tag_id", checkIfTagExistsById, getTagByID);

router.get("/slug/:slug", checkIfTagExistsBySlug, getTagBySlug);

router.post(
  "/",
  isAuthenticated,
  checkTagPermissions,
  tagValidationRules(),
  validate,
  validateSlugFormat,
  generateTagSlugIfNeeded,
  createTag,
);

router.put(
  "/:tag_id",
  isAuthenticated,
  checkTagPermissions,
  checkIfTagExistsById,
  tagUpdateValidationRules(),
  validate,
  generateTagSlugIfNeeded,
  updateTag,
);

router.delete(
  "/:tag_id",
  isAuthenticated,
  checkTagPermissions,
  checkIfTagExistsById,
  checkTagDependencies,
  deleteTag,
);

export default router;
