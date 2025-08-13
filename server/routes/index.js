import express from "express";
const router = express.Router();

// Import the individual route modules.
import authRoutes from "./auth.routes.js";
import postRoutes from "./post.routes.js";
import commentRoutes from "./comment.routes.js";
import categoryRoutes from "./category.routes.js";
import tagRoutes from "./tag.routes.js";

// TODO(zzmic): Import additional route modules as they are created.
// import userRoutes from "./user.routes.js";
// import adminRoutes from "./admin.routes.js";

// Mount the individual routers onto the main API router.
router.use("/auth", authRoutes); // Authentication routes (signup, login, logout).
router.use("/posts", postRoutes); // Post-related routes (create post, get posts, update post, delete post).
router.use("/comments", commentRoutes); // Comment-related routes (create comment, get comments, update comment, delete comment).
router.use("/categories", categoryRoutes); // Category-related routes (create category, get categories, update category, delete category).
router.use("/tags", tagRoutes); // Tag-related routes (create tag, get tags, update tag, delete tag).

// TODO(zzmic): Mount additional routes as they are implemented.
// User-related routes (get user profile, update user, delete user).
// router.use("/users", userRoutes);

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

export default router;
