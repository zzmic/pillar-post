import db from "../models/index.js";
const Posts = db.posts;

// Utility function to generate a slug from a title.
const generateSlug = (title) => {
  if (!title || typeof title !== "string") {
    throw new Error(
      "Invalid title provided for slug generation: it must be a non-empty string.",
    );
  }
  return title
    .normalize("NFD") // Normalize Unicode characters to decompose combined characters.
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics.
    .toLowerCase() // Convert to lowercase.
    .trim() // Trim leading/trailing whitespace.
    .replace(/\s+/g, "-") // Replace spaces with hyphens.
    .replace(/[^\p{L}\p{N}-]+/gu, "") // Remove all non-letter/number characters (Unicode-safe).
    .replace(/--+/g, "-") // Collapse multiple hyphens.
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens.
};

const ensureUniquePostSlug = async (slug, postId = null) => {
  if (!slug || typeof slug !== "string") {
    throw new Error(
      "Invalid slug provided for uniqueness check: it must be a non-empty string.",
    );
  }
  let uniqueSlug = slug;
  let count = 0;
  let isUnique = false;
  while (!isUnique) {
    try {
      let existingPost;
      if (postId) {
        existingPost = await Posts.findOne({
          where: {
            slug: uniqueSlug,
            post_id: { [db.Sequelize.Op.ne]: postId },
          },
        });
      } else {
        existingPost = await Posts.findOne({ where: { slug: uniqueSlug } });
      }
      if (!existingPost) {
        isUnique = true;
      } else {
        count++;
        uniqueSlug = `${slug}-${count}`;
      }
    } catch {
      throw new Error("Error checking slug uniqueness.");
    }
  }
  return uniqueSlug;
};

const ensureUniqueCategorySlug = async (baseSlug, excludeId = null) => {
  let uniqueSlug = baseSlug;
  let counter = 0;
  let isUnique = false;

  while (!isUnique) {
    const whereClause = { slug: uniqueSlug };
    if (excludeId) {
      whereClause.category_id = { [db.Sequelize.Op.ne]: excludeId };
    }

    const existingCategory = await db.categories.findOne({
      where: whereClause,
    });

    if (!existingCategory) {
      isUnique = true;
    } else {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }
  }

  return uniqueSlug;
};

const ensureUniqueTagSlug = async (slug, tagId = null) => {
  if (!slug || typeof slug !== "string") {
    throw new Error(
      "Invalid slug provided for uniqueness check: it must be a non-empty string.",
    );
  }
  let uniqueSlug = slug;
  let count = 0;
  let isUnique = false;
  while (!isUnique) {
    try {
      let existingTag;
      if (tagId) {
        existingTag = await db.tags.findOne({
          where: {
            slug: uniqueSlug,
            tag_id: { [db.Sequelize.Op.ne]: tagId },
          },
        });
      } else {
        existingTag = await db.tags.findOne({ where: { slug: uniqueSlug } });
      }
      if (!existingTag) {
        isUnique = true;
      } else {
        count++;
        uniqueSlug = `${slug}-${count}`;
      }
    } catch {
      throw new Error("Error checking slug uniqueness.");
    }
  }
  return uniqueSlug;
};

const validateSlugFormat = (req, res, next) => {
  const slug = req.body.slug;

  if (slug) {
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!slugPattern.test(slug)) {
      return res.status(400).json({
        status: "fail",
        message:
          "Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.",
      });
    }

    if (slug.length < 1 || slug.length > 100) {
      return res.status(400).json({
        status: "fail",
        message: "Slug must be between 1 and 100 characters long.",
      });
    }
  }

  next();
};

const generateCategorySlugIfNeeded = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    const category_id = req.params.category_id;

    if (!name && !slug) {
      return next();
    }

    let finalSlug = slug || generateSlug(name);
    finalSlug = await ensureUniqueCategorySlug(finalSlug, category_id);

    req.body.slug = finalSlug;
    next();
  } catch (error) {
    console.error("Error generating category slug:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during slug generation.",
    });
  }
};

const generateTagSlugIfNeeded = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    const tag_id = req.params.tag_id;

    if (!name && !slug) {
      return next();
    }

    let finalSlug = slug || generateSlug(name);
    finalSlug = await ensureUniqueTagSlug(finalSlug, tag_id);

    req.body.slug = finalSlug;
    next();
  } catch (error) {
    console.error("Error generating tag slug:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during slug generation.",
    });
  }
};

export {
  generateSlug,
  ensureUniquePostSlug,
  ensureUniqueCategorySlug,
  ensureUniqueTagSlug,
  validateSlugFormat,
  generateCategorySlugIfNeeded,
  generateTagSlugIfNeeded,
};
