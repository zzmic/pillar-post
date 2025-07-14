// Load the environment variables from the `.env` file.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./models");

// Create an instance of an Express.js application.
const app = express();
// Use the port from either the environment variable or default to 3001.
const PORT = process.env.PORT || 3001;

// Configure the middleware.
app.use(cors()); // Enable CORS (Cross-Origin Resource Sharing) for all routes (for development purposes).
app.use(express.json()); // Parse JSON bodies.
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies.

// Simple route for the root path ("/").
// This route responds with a message indicating the server is running.
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Example route for testing backend communication.
// This route responds with a JSON object containing a message and a timestamp.
app.get("/api/test", (req, res) => {
  res.json({
    message: "Hello from the backend API (via /api/test)!",
    timestamp: new Date().toISOString(),
  });
});

// Example route for handling POST requests to "/api/data".
// This route expects a JSON body with a "message" field.
app.post("/api/data", (req, res) => {
  // Log the received data to the console.
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

// Synchronize the application's database models with the actual database
// and start the server only if the synchronization is successful.
db.sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database and tables synced!");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to sync database:", error.message);
    process.exit(1);
  });
