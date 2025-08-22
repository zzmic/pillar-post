import db from "../models/index.js";
const Category = db.categories;

/**
 * Create a new category.
 * @route POST /api/categories
 * @access Private (Admin only)
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, slug } = req.body;

    const categoryData = {
      name,
      description: description || null,
      slug,
    };

    const category = await Category.create(categoryData);

    res.status(201).json({
      status: "success",
      message: "Category created successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    console.error("Error creating category:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        status: "fail",
        message: "A category with this name or slug already exists",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

/**
 * Update an existing category.
 * @route PUT /api/categories/:category_id
 * @access Private (Admin only)
 */
const updateCategory = async (req, res) => {
  try {
    const category = req.category;
    const { name, description, slug } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (slug !== undefined) updateData.slug = slug;

    await category.update(updateData);

    res.status(200).json({
      status: "success",
      message: "Category updated successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        status: "fail",
        message: "A category with this name or slug already exists",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

/**
 * Delete a category.
 * @route DELETE /api/categories/:category_id
 * @access Private (Admin only)
 */
const deleteCategory = async (req, res) => {
  try {
    const category = req.category;

    await category.destroy();

    res.status(200).json({
      status: "success",
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export { createCategory, updateCategory, deleteCategory };
