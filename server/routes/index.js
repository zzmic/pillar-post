const express = require("express");
const router = express.Router();

// Import the individual route modules.
const authRoutes = require("./auth.routes");
const postRoutes = require("./post.routes");
const commentRoutes = require("./comment.routes");

// TODO(zzmic): Import additional route modules as they are created.
// const userRoutes = require("./user.routes");
// const categoryRoutes = require("./category.routes");
// const tagRoutes = require("./tag.routes");
// const adminRoutes = require("./admin.routes");

// Mount the individual routers onto the main API router.
router.use("/auth", authRoutes); // Authentication routes (signup, login, logout).
router.use("/posts", postRoutes); // Post-related routes (create post, get posts, update post, delete post).
router.use("/comments", commentRoutes); // Comment-related routes (create comment, get comments, update comment, delete comment).

// TODO(zzmic): Mount additional routes as they are implemented.
// User-related routes (get user profile, update user, delete user).
// router.use("/users", userRoutes);

// Category-related routes (create category, get categories, update category, delete category).
// router.use("/categories", categoryRoutes);

// Tag-related routes (create tag, get tags, update tag, delete tag).
// router.use("/tags", tagRoutes);

// Admin-specific routes (manage users, manage content, system administration).
// router.use("/admin", adminRoutes);

/* Utility routes for testing and development. */
// Test route to verify backend connectivity.
router.get("/test", (req, res) => {
  res.json({
    message: "Hello from the backend API (via /api/test)!",
    timestamp: new Date().toISOString(),
  });
});

// Test route to receive and log data.
router.post("/data", (req, res) => {
  // Log the received data to the console
  console.log("Received data:", req.body);
  // If the request body contains a message, respond with a success message.
  // Otherwise, respond with an error message.
  if (req.body && req.body.message) {
    res.json({
      status: "success",
      receivedMessage: req.body.message,
      serverTime: new Date().toISOString(),
    });
  } else {
    res.status(400).json({
      status: "error",
      errorMessage: "No message provided in the request body.",
    });
  }
});

module.exports = router;
