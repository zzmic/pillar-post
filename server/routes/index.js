const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");

// TODO(zzmic): Import additional route modules as they are created.
// const userRoutes = require("./user.routes");
// const postRoutes = require("./post.routes");
// const commentRoutes = require("./comment.routes");
// const categoryRoutes = require("./category.routes");
// const tagRoutes = require("./tag.routes");
// const adminRoutes = require("./admin.routes");

// Middleware for authentication and authorization.
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

// Mount individual routers onto the main API router.
// Authentication routes (signup, login, logout).
router.use("/auth", authRoutes);

// TODO(zzmic): Mount additional routes as they are implemented.
// User-related routes (get user profile, update user, delete user).
// router.use("/users", userRoutes);

// Post-related routes (create post, get posts, update post, delete post).
// router.use("/posts", postRoutes);

// Comment-related routes (create comment, get comments, update comment, delete comment).
// router.use("/comments", commentRoutes);

// Category-related routes (create category, get categories, update category, delete category).
// router.use("/categories", categoryRoutes);

// Tag-related routes (create tag, get tags, update tag, delete tag).
// router.use("/tags", tagRoutes);

// Admin-specific routes (manage users, manage content, system administration).
// router.use("/admin", adminRoutes);

/* Temporary routes (these should eventually be moved to appropriate route files). */
// Example protected route that requires authentication.
router.get("/protected", isAuthenticated, (req, res) => {
  res.json({
    message: "This is only accessible to authenticated users.",
    userId: req.session.userId,
    userRole: req.session.role,
    timestamp: new Date().toISOString(),
  });
});

// Example admin route that requires admin authentication.
router.get("/admin", isAuthenticated, isAdmin, (req, res) => {
  res.json({
    message: "This is only accessible to admin users.",
    userId: req.session.userId,
    userRole: req.session.role,
    timestamp: new Date().toISOString(),
  });
});

// Example route for testing backend communication.
router.get("/test", (req, res) => {
  res.json({
    message: "Hello from the backend API (via /api/test)!",
    timestamp: new Date().toISOString(),
  });
});

// Example route for handling POST requests to `api/data`.
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
