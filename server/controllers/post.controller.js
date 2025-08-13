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

// Function to create a new post.
const createPost = async (req, res, next) => {
  try {
    const { title, body, slug, status } = req.body;
    const user_id = req.user.user_id;

    // Generate a slug from the title if not provided (and ensure its uniqueness).
    let finalSlug = slug || generateSlug(title);
    finalSlug = await ensureUniquePostSlug(finalSlug);

    // Create the new post.
    const newPost = await Posts.create({
      title,
      body: body,
      slug: finalSlug,
      status,
      user_id: user_id,
    });

    // Fetch the created post with its associated data.
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

// Function to get all posts with pagination and filtering.
const getAllPosts = async (req, res, next) => {
  try {
    const paginationOptions = getPaginationOptions(req);
    const { category, tag, status, search } = req.query;
    const userRole = req.user ? req.user.role : null;

    // Build the where-conditions based on the user's role and query parameters.
    const whereConditions = {};
    if (userRole !== "admin") {
      whereConditions.status = "published";
    } else if (status) {
      // If the user is an admin, allow filtering by status.
      whereConditions.status = status;
    }

    // Add the search functionality for titles and bodies.
    if (search) {
      whereConditions[db.Sequelize.Op.or] = [
        { title: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { body: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    // Build the include-array for associated models with optional filtering.
    const includeArray = [
      { model: Users, as: "author", attributes: ["user_id", "username"] },
      {
        model: Categories,
        as: "categories",
        ...(category && { where: { slug: category } }),
      },
      { model: Tags, as: "tags", ...(tag && { where: { slug: tag } }) },
    ];

    // Fetch the posts with pagination and filtering.
    const { count, rows } = await Posts.findAndCountAll({
      where: whereConditions,
      include: includeArray,
      order: [["created_at", "DESC"]],
      distinct: true,
      ...paginationOptions,
    });

    // Build the paginated response.
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

// Function to get a single post.
const getPostById = async (req, res, next) => {
  try {
    const post_id = req.params.post_id;

    // Fetch the post with its associated data.
    const post = await Posts.findByPk(post_id, {
      include: [
        { model: Users, as: "author", attributes: ["user_id", "username"] },
        { model: Categories, as: "categories" },
        { model: Tags, as: "tags" },
      ],
    });

    // Check if the post exists.
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    // Handle the access control for draft posts.
    if (post.status == "draft") {
      const user_id = req.user ? req.user.user_id : null;
      const userRole = req.user ? req.user.role : null;
      // If the user is not authenticated or not an admin, deny access.
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

// Function to update a post.
const updatePost = async (req, res, next) => {
  try {
    const post_id = req.params.post_id;
    const { title, body, slug, status } = req.body;

    // Build the update data object with the provided fields.
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

    // Update the post in the database.
    await Posts.update(updateData, { where: { post_id: post_id } });

    // Fetch the updated post with its associated data.
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

// Function to delete a post.
const deletePost = async (req, res, next) => {
  try {
    const post_id = req.params.post_id;

    // Delete the post from the database.
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
