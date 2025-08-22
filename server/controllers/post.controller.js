import db from "../models/index.js";
const Posts = db.posts;
const Users = db.users;
const Categories = db.categories;
const Tags = db.tags;
import {
  getPaginationOptions,
  buildPaginatedResponse,
} from "../utils/pagination.utils.js";
import { generateSlug, ensureUniquePostSlug } from "../utils/slug.utils.js";

/**
 * Create a new post.
 * @route POST /api/posts
 * @access Private (Author and Admin only)
 */
const createPost = async (req, res, next) => {
  try {
    const { title, body, slug, status } = req.body;
    const user_id = req.user.user_id;

    let finalSlug = slug || generateSlug(title);
    finalSlug = await ensureUniquePostSlug(finalSlug);

    const newPost = await Posts.create({
      title,
      body: body,
      slug: finalSlug,
      status,
      user_id: user_id,
    });

    const createdPost = await Posts.findByPk(newPost.post_id, {
      include: [
        { model: Users, as: "author", attributes: ["user_id", "username"] },
        { model: Categories, as: "categories" },
        { model: Tags, as: "tags" },
      ],
    });

    res.status(201).json({
      status: "success",
      message: "Post created successfully",
      data: {
        post: createdPost,
      },
    });
  } catch (err) {
    console.error("Error creating post:", err);
    next(err);
  }
};

/**
 * Get all posts with pagination and filtering.
 * @route GET /api/posts
 * @access Public
 */
const getAllPosts = async (req, res, next) => {
  try {
    const paginationOptions = getPaginationOptions(req);
    const { category, tag, status, search } = req.query;
    const userRole = req.user ? req.user.role : null;

    const whereConditions = {};
    if (userRole !== "admin") {
      whereConditions.status = "published";
    } else if (status) {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions[db.Sequelize.Op.or] = [
        { title: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { body: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    const includeArray = [
      { model: Users, as: "author", attributes: ["user_id", "username"] },
      {
        model: Categories,
        as: "categories",
        ...(category && { where: { slug: category } }),
      },
      { model: Tags, as: "tags", ...(tag && { where: { slug: tag } }) },
    ];

    const { count, rows } = await Posts.findAndCountAll({
      where: whereConditions,
      include: includeArray,
      order: [["created_at", "DESC"]],
      distinct: true,
      ...paginationOptions,
    });

    const response = buildPaginatedResponse(rows, count, paginationOptions);

    res.status(200).json({
      status: "success",
      message: "Posts fetched successfully",
      data: response,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    next(err);
  }
};

/**
 * Get a single post.
 * @route GET /api/posts/:post_id
 * @access Public
 */
const getPostById = async (req, res, next) => {
  try {
    const post_id = req.params.post_id;

    const post = await Posts.findByPk(post_id, {
      include: [
        { model: Users, as: "author", attributes: ["user_id", "username"] },
        { model: Categories, as: "categories" },
        { model: Tags, as: "tags" },
      ],
    });

    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    if (post.status == "draft") {
      const user_id = req.user ? req.user.user_id : null;
      const userRole = req.user ? req.user.role : null;
      if (!user_id || (post.user_id !== user_id && userRole !== "admin")) {
        return res.status(403).json({
          status: "fail",
          message:
            "Access denied: You do not have permission to view this post.",
        });
      }
    }

    res.status(200).json({
      status: "success",
      message: "Post fetched successfully",
      data: {
        post,
      },
    });
  } catch (err) {
    console.error("Error fetching post:", err);
    next(err);
  }
};

/**
 * Update a post.
 * @route PUT /api/posts/:post_id
 * @access Private (Author and Admin only)
 */
const updatePost = async (req, res, next) => {
  try {
    const post_id = req.params.post_id;
    const { title, body, slug, status } = req.body;

    const updateData = {};
    if (title) {
      updateData.title = title;
    }
    if (body) {
      updateData.body = body;
    }
    if (slug) {
      updateData.slug = slug;
    }
    if (status) {
      updateData.status = status;
    }

    await Posts.update(updateData, { where: { post_id: post_id } });

    const updatedPost = await Posts.findByPk(post_id, {
      include: [
        { model: Users, as: "author", attributes: ["user_id", "username"] },
        { model: Categories, as: "categories" },
        { model: Tags, as: "tags" },
      ],
    });

    res.status(200).json({
      status: "success",
      message: "Post updated successfully",
      data: {
        post: updatedPost,
      },
    });
  } catch (err) {
    console.error("Error updating post:", err);
    next(err);
  }
};

/**
 * Delete a post.
 * @route DELETE /api/posts/:post_id
 * @access Private (Author and Admin only)
 */
const deletePost = async (req, res, next) => {
  try {
    const post_id = req.params.post_id;

    await Posts.destroy({ where: { post_id: post_id } });

    res.status(200).json({
      status: "success",
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    next(err);
  }
};

export { createPost, getAllPosts, getPostById, updatePost, deletePost };
