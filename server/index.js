// Load the environment variables from the `.env` file.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");

// Import the database models and configuration.
const db = require("./models");
const dbConfig =
  require("./config/config.db")[process.env.NODE_ENV || "development"];

// Create an instance of an Express.js application.
const app = express();
// Use the port from either the environment variable or default to 3001.
const PORT = process.env.PORT || 3001;

// Create a new PostgreSQL connection pool.
const sessionPgPool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
});

// Create an event listener for errors in the PostgreSQL session pool.
sessionPgPool.on("error", (err) => {
  console.error("Error in PostgreSQL session pool:", err);
});

const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds.
app.use(cookieParser()); // Parse cookies from the request.
app.use(
  session({
    store: new pgSession({
      pool: sessionPgPool, // Use the PostgreSQL connection pool for session storage.
      tableName: "session", // Name of the table to store sessions.
    }),
    secret: process.env.SESSION_SECRET, // Secret for signing the session ID cookie.
    resave: false, // Do not resave the session if it hasn't changed.
    saveUninitialized: false, // Do not create a session until something is stored.
    cookie: {
      maxAge: oneDay, // Set cookie expiration to one day.
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production.
      sameSite: "Lax", // Use "SameSite's default Lax value" for the CSRF prevention.
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie.
    },
  })
);
app.use(helmet()); // Enhance security by setting various HTTP headers.

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes.
  max: 100, // Limit each IP to 100 requests per `windowMs`.
  message: "Too many requests from this IP. Please try again after 15 minutes.",
  standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers.
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Allow requests from this origin.
  credentials: true, // Allow session cookies to be sent cross-origin.
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); // Enable CORS (Cross-Origin Resource Sharing) for all routes (for development purposes).
app.use(express.json()); // Parse JSON bodies.
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies.

// Import the consolidated API routes.
const apiRoutes = require("./routes");

// Apply rate limiting to authentication routes.
app.use("/api/auth", authLimiter);

// Mount the consolidated API router at the `/api` path.
app.use("/api", apiRoutes);

// Simple route for the root path ("/").
// This route responds with a message indicating the server is running.
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Global error handling middleware.
app.use((err, req, res, next) => {
  console.error("Error occurred:", err.stack);
  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";
  if (err.name === "UnauthorizedError" || err.name === "ForbiddenError") {
    statusCode = err.statusCode;
    message = err.message;
  }
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
    },
  });
});

// Start the server, assuming migrations have been run separately and the database is ready.
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Uncomment the following lines to sync the database and start the server afterwards.
// db.sequelize
//   .sync({ force: false })
//   .then(() => {
//     console.log("Database and tables synced!");
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("Failed to sync database:", err.message);
//     process.exit(1);
//   });
