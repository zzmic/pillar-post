import db from "../models/index.js";
const Category = db.categories;

// Middleware function to check if a category exists by ID.
const checkCategoryExistsByID = async (req, res, next) => {
  try {
    const category_id = req.params.category_id;
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(404).json({
        status: "fail",
        message: "Category not found",
      });
    }
    req.category = category;
    next();
  } catch (err) {
    console.error("Error checking category existence:", err);
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid category ID format",
      });
    }
    next(err);
  }
};

// Middleware function to check if a category exists by slug.
const checkCategoryExistsBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const category = await Category.findOne({ where: { slug } });
    if (!category) {
      return res.status(404).json({
        status: "fail",
        message: "Category not found",
      });
    }
    req.category = category;
    next();
  } catch (err) {
    console.error("Error checking category existence by slug:", err);
    next(err);
  }
};

// Middleware function to check category management permissions (Admin only).
const checkCategoryPermissions = (req, res, next) => {
  const userRole = req.user ? req.user.role : null;
  if (!req.user) {
    return res.status(401).json({
      status: "fail",
      message: "Authentication required: Please sign in",
    });
  }
  if (userRole !== "admin") {
    return res.status(403).json({
      status: "fail",
      message:
        "Access denied: Administrator privileges required for category management",
    });
  }

  next();
};

// Middleware function to check for category dependencies before deletion.
const checkCategoryDependencies = async (req, res, next) => {
  try {
    const category = req.category;
    const postCount = await db.posts.count({
      include: [
        {
          model: Category,
          as: "categories",
          where: { category_id: category.category_id },
        },
      ],
    });
    if (postCount > 0) {
      return res.status(409).json({
        status: "fail",
        message: `Cannot delete category. It is associated with ${postCount} post(s). Please remove the category from all posts before deletion.`,
        data: {
          associatedPosts: postCount,
        },
      });
    }
    next();
  } catch (error) {
    console.error("Error checking category dependencies:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while checking category dependencies",
    });
  }
};

export {
  checkCategoryExistsByID,
  checkCategoryExistsBySlug,
  checkCategoryPermissions,
  checkCategoryDependencies,
};
