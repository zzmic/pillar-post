import db from "../models/index.js";
const Tags = db.tags;
const Posts = db.posts;

/**
 * Check if a tag exists by ID
 */
const checkTagExistsByID = async (req, res, next) => {
  try {
    const { tag_id } = req.params;

    const tag = await Tags.findByPk(tag_id);

    if (!tag) {
      return res.status(404).json({
        status: "fail",
        message: "Tag not found",
      });
    }

    req.tag = tag;
    next();
  } catch (error) {
    console.error("Error checking tag existence:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to check tag existence",
      error: error.message,
    });
  }
};

/**
 * Check if a tag exists by slug
 */
const checkTagExistsBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const tag = await Tags.findOne({
      where: { slug },
    });

    if (!tag) {
      return res.status(404).json({
        status: "fail",
        message: "Tag not found",
      });
    }

    req.tag = tag;
    next();
  } catch (error) {
    console.error("Error checking tag existence:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to check tag existence",
      error: error.message,
    });
  }
};

/**
 * Check if user has permission to manage tags (admin only)
 */
const checkTagPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        message: "Authentication required",
      });
    }

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Admin privileges required to manage tags",
      });
    }

    next();
  } catch (error) {
    console.error("Error checking tag permissions:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to check permissions",
      error: error.message,
    });
  }
};

/**
 * Check tag dependencies before deletion
 */
const checkTagDependencies = async (req, res, next) => {
  try {
    const { tag_id } = req.params;

    // Check if tag is used in any posts
    const tag = await Tags.findByPk(tag_id, {
      include: [
        {
          model: Posts,
          as: "posts",
          through: { attributes: [] }, // Don't include join table attributes
        },
      ],
    });

    if (!tag) {
      return res.status(404).json({
        status: "fail",
        message: "Tag not found",
      });
    }

    // If tag has associated posts, prevent deletion
    if (tag.posts && tag.posts.length > 0) {
      return res.status(400).json({
        status: "fail",
        message:
          "Cannot delete tag that is associated with posts. Remove tag from all posts first.",
      });
    }

    req.tag = tag;
    next();
  } catch (error) {
    console.error("Error checking tag dependencies:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to check tag dependencies",
      error: error.message,
    });
  }
};

export {
  checkTagExistsByID,
  checkTagExistsBySlug,
  checkTagPermissions,
  checkTagDependencies,
};
