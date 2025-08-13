import express from "express";
const router = express.Router();

import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  validate,
  tagValidationRules,
  tagUpdateValidationRules,
} from "../middleware/validation.middleware.js";
import {
  checkTagExistsByID,
  checkTagExistsBySlug,
  checkTagPermissions,
  checkTagDependencies,
} from "../middleware/tag.middleware.js";
import {
  validateSlugFormat,
  generateTagSlugIfNeeded,
} from "../utils/slug.utils.js";
import {
  createTag,
  getAllTags,
  getTagByID,
  getTagBySlug,
  updateTag,
  deleteTag,
} from "../controllers/tag.controller.js";

// GET /api/tags - Get all tags (public).
router.get("/", getAllTags);

// GET /api/tags/:tag_id - Get a specific tag by ID (public).
router.get("/:tag_id", checkTagExistsByID, getTagByID);

// GET /api/tags/slug/:slug - Get a specific tag by slug (public).
router.get("/slug/:slug", checkTagExistsBySlug, getTagBySlug);

// POST /api/tags - Create a new tag (admin only).
router.post(
  "/",
  isAuthenticated,
  checkTagPermissions,
  tagValidationRules(),
  validate,
  validateSlugFormat,
  generateTagSlugIfNeeded,
  createTag
);

// PUT /api/tags/:tag_id - Update an existing tag (admin only).
router.put(
  "/:tag_id",
  isAuthenticated,
  checkTagPermissions,
  checkTagExistsByID,
  tagUpdateValidationRules(),
  validate,
  generateTagSlugIfNeeded,
  updateTag
);

// DELETE /api/tags/:tag_id - Delete a tag (admin only).
router.delete(
  "/:tag_id",
  isAuthenticated,
  checkTagPermissions,
  checkTagExistsByID,
  checkTagDependencies,
  deleteTag
);

export default router;
