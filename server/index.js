// Load environment variables from the `.env` file.
require("dotenv").config();

// Import necessary modules.
const express = require("express");
const cors = require("cors");

// Create an instance of an Express application.
const app = express();
// Use the port from either the environment variable or default to 3000.
const PORT = process.env.PORT || 3000;

// Configure the middleware.
app.use(cors()); // Enable CORS (Cross-Origin Resource Sharing) for all routes (for development purposes).
app.use(express.json()); // Parse JSON bodies.
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies.

// Simple route for the root path ("/").
// This route responds with a message indicating the server is running.
app.get("/", (req, res) => {
  res.send("Server is running!");
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

// Start the server and listen on the specified port.
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
