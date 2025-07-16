const db = require("../models");
const Post = db.posts;

// Utility function to generate a slug from a title.
const generateSlug = (title) => {
  if (!title || typeof title !== "string") {
    throw new Error(
      "Invalid title provided for slug generation: it must be a non-empty string."
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

const ensureUniqueSlug = async (slug, postId = null) => {
  if (!slug || typeof slug !== "string") {
    throw new Error(
      "Invalid slug provided for uniqueness check: it must be a non-empty string."
    );
  }
  let uniqueSlug = slug;
  let count = 0;
  let isUnique = false;
  while (!isUnique) {
    try {
      let existingPost;
      if (postId) {
        existingPost = await Post.findOne({
          where: {
            slug: uniqueSlug,
            post_id: { [db.Sequelize.Op.ne]: postId },
          },
        });
      } else {
        existingPost = await Post.findOne({ where: { slug: uniqueSlug } });
      }
      if (!existingPost) {
        isUnique = true;
      } else {
        count++;
        uniqueSlug = `${slug}-${count}`;
      }
    } catch (error) {
      throw new Error("Error checking slug uniqueness.");
    }
  }
  return uniqueSlug;
};

module.exports = {
  generateSlug,
  ensureUniqueSlug,
};
