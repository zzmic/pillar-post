import db from "../models/index.js";
const Tags = db.tags;
const { Op } = db.Sequelize;

/**
 * Create a new tag.
 * @route POST /api/tags
 * @access Private (Admin only)
 */
const createTag = async (req, res) => {
  try {
    const { name, slug } = req.body;

    const existingTag = await Tags.findOne({
      where: {
        [Op.or]: [{ name: name }, { slug: slug }],
      },
    });

    if (existingTag) {
      return res.status(400).json({
        status: "fail",
        message: "Tag with this name or slug already exists",
      });
    }

    const newTag = await Tags.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
    });

    res.status(201).json({
      status: "success",
      message: "Tag created successfully",
      data: {
        tag: newTag,
      },
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to create tag",
      error: error.message,
    });
  }
};

/**
 * Get all tags.
 * @route GET /api/tags
 * @access Public
 */
const getAllTags = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: tags } = await Tags.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["name", "ASC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      status: "success",
      message: "Tags fetched successfully",
      data: {
        tags,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount: count,
          limit: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? parseInt(page) + 1 : null,
          prevPage: page > 1 ? parseInt(page) - 1 : null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to fetch tags",
      error: error.message,
    });
  }
};

/**
 * Get a specific tag by ID.
 * @route GET /api/tags/:tag_id
 * @access Public
 */
const getTagByID = async (req, res) => {
  try {
    const { tag_id } = req.params;

    const tag = await Tags.findByPk(tag_id);

    if (!tag) {
      return res.status(404).json({
        status: "fail",
        message: "Tag not found",
      });
    }

    res.json({
      status: "success",
      message: "Tag fetched successfully",
      data: {
        tag,
      },
    });
  } catch (error) {
    console.error("Error fetching tag:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to fetch tag",
      error: error.message,
    });
  }
};

/**
 * Get a specific tag by slug.
 * @route GET /api/tags/slug/:slug
 * @access Public
 */
const getTagBySlug = async (req, res) => {
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

    res.json({
      status: "success",
      message: "Tag fetched successfully",
      data: {
        tag,
      },
    });
  } catch (error) {
    console.error("Error fetching tag:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to fetch tag",
      error: error.message,
    });
  }
};

/**
 * Update a tag.
 * @route PUT /api/tags/:tag_id
 * @access Private (Admin only)
 */
const updateTag = async (req, res) => {
  try {
    const { tag_id } = req.params;
    const { name, slug } = req.body;

    const tag = await Tags.findByPk(tag_id);

    if (!tag) {
      return res.status(404).json({
        status: "fail",
        message: "Tag not found",
      });
    }

    if (name || slug) {
      const existingTag = await Tags.findOne({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ name: name || tag.name }, { slug: slug || tag.slug }],
            },
            {
              tag_id: { [Op.ne]: tag_id },
            },
          ],
        },
      });

      if (existingTag) {
        return res.status(400).json({
          status: "fail",
          message: "Tag with this name or slug already exists",
        });
      }
    }

    await tag.update({
      name: name || tag.name,
      slug: slug || tag.slug,
    });

    res.json({
      status: "success",
      message: "Tag updated successfully",
      data: {
        tag,
      },
    });
  } catch (error) {
    console.error("Error updating tag:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to update tag",
      error: error.message,
    });
  }
};

/**
 * Delete a tag.
 * @route DELETE /api/tags/:tag_id
 * @access Private (Admin only)
 */
const deleteTag = async (req, res) => {
  try {
    const { tag_id } = req.params;

    const tag = await Tags.findByPk(tag_id);

    if (!tag) {
      return res.status(404).json({
        status: "fail",
        message: "Tag not found",
      });
    }

    await tag.destroy();

    res.json({
      status: "success",
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to delete tag",
      error: error.message,
    });
  }
};

export {
  createTag,
  getAllTags,
  getTagByID,
  getTagBySlug,
  updateTag,
  deleteTag,
};
