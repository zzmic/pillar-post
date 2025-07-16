const { body } = require("express-validator");
const db = require("../models");
const { sequelize } = db;
const Post = db.posts;
const User = db.users;
const Category = db.categories;
const Tag = db.tags;
const {
  getPaginationOptions,
  buildPaginatedResponse,
} = require("../utils/pagination.utils");
const { generateSlug, ensureUniqueSlug } = require("../utils/slug.utils");

// Controller to create a new post.
const createPost = async (req, res, next) => {
  try {
    const { title, body, slug, status } = req.body;
    const userId = req.user.userId;
    let finalSlug = slug || generateSlug(title);
    finalSlug = await ensureUniqueSlug(finalSlug);
    const newPost = await Post.create({
      title,
      body: body,
      slug: finalSlug,
      status,
      user_id: userId,
    });
    const createdPost = await Post.findByPk(newPost.post_id, {
      include: [
        { model: User, as: "author", attributes: ["user_id", "username"] },
        { model: Category, as: "categories" },
        { model: Tag, as: "tags" },
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

// Controller to get all posts with pagination and filtering.
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
      { model: User, as: "author", attributes: ["user_id", "username"] },
      {
        model: Category,
        as: "categories",
        ...(category && { where: { slug: category } }),
      },
      { model: Tag, as: "tags", ...(tag && { where: { slug: tag } }) },
    ];
    const { count, rows } = await Post.findAndCountAll({
      where: whereConditions,
      include: includeArray,
      order: [["created_at", "DESC"]],
      distinct: true, // Important for accurate count with joins
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

// Controller to get a single post by ID.
const getPostById = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findByPk(postId, {
      include: [
        { model: User, as: "author", attributes: ["user_id", "username"] },
        { model: Category, as: "categories" },
        { model: Tag, as: "tags" },
      ],
    });
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }
    if (post.status == "draft") {
      const userId = req.user ? req.user.userId : null;
      const userRole = req.user ? req.user.role : null;
      if (!userId || (post.user_id !== userId && userRole !== "admin")) {
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

const updatePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { title, body, slug, status } = req.body;
    const post = res.post;
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
    await Post.update(updateData, { where: { post_id: postId } });
    const updatedPost = await Post.findByPk(postId, {
      include: [
        { model: User, as: "author", attributes: ["user_id", "username"] },
        { model: Category, as: "categories" },
        { model: Tag, as: "tags" },
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

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    await Post.destroy({ where: { post_id: postId } });
    res.status(200).json({
      status: "success",
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    next(err);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};
