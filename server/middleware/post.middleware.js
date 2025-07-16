const sanitizeHtml = require("sanitize-html");
const db = require("../models");
const Post = db.posts;

// Middleware to check the ownership of a post.
const checkPostOwnership = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user ? req.user.userId : null;
    const userRole = req.user ? req.user.role : null;
    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized access: User not authenticated.",
      });
    }
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found.",
      });
    }
    if (post.user_id.toString() !== userId.toString() && userRole !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Access denied: You do not own this post.",
      });
    }
    res.post = post;
    next();
  } catch (error) {
    console.error("Error in checkPostOwnership middleware:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid post ID format.",
      });
    }
    res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

// Middleware to check if a post exists.
const checkPostExists = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found.",
      });
    }
    res.post = post;
    next();
  } catch (error) {
    console.error("Error in checkPostExists middleware:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid post ID format.",
      });
    }
    res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

// Helper function to generate a (URL-friendly) slug for a post.
const generatePostSlug = (text) => {
  return text
    .toString()
    .normalize("NFD") // Normalize Unicode characters to decompose combined characters.
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics.
    .toLowerCase() // Convert to lowercase.
    .trim() // Trim leading/trailing whitespace.
    .replace(/\s+/g, "-") // Replace spaces with hyphens.
    .replace(/[^\p{L}\p{N}-]+/gu, "") // Remove all non-letter/number characters (Unicode-safe).
    .replace(/--+/g, "-") // Collapse multiple hyphens.
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens.
};

// Middleware to generate a slug for a post if needed.
const generatePostSlugIfNeeded = async (req, res, next) => {
  try {
    let slug = req.body.slug;
    const title = req.body.title;
    const postId = req.params.id;
    if (!title) {
      return res.status(400).json({
        status: "fail",
        message: "Title is required to generate a slug.",
      });
    }
    if (!slug) {
      slug = generatePostSlug(title);
    } else {
      slug = generatePostSlug(slug);
    }
    let uniqueSlug = slug;
    let counter = 0;
    let isUnique = false;
    while (!isUnique) {
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
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
    }
    req.body.slug = uniqueSlug;
    next();
  } catch (error) {
    console.error("Error in generatePostSlugIfNeeded middleware:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

// Middleware to sanitize the HTML content of a post.
const sanitizePostContent = (req, res, next) => {
  try {
    if (req.body.content) {
      const sanitizedContent = sanitizeHtml(req.body.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "img",
          "iframe",
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          iframe: [
            "src",
            "width",
            "height",
            "frameborder",
            "allowfullscreen",
            "sandbox",
          ],
        },
      });
      req.body.content = sanitizedContent;
    }
    next();
  } catch (error) {
    console.error("Error in sanitizePostContent middleware:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

module.exports = {
  checkPostOwnership,
  checkPostExists,
  generatePostSlugIfNeeded,
  sanitizePostContent,
};
