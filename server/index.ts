import dotenv from "dotenv";
dotenv.config();

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

const PgSessionStore = connectPgSimple(session);

import config from "./config/config.js";
const environment = (process.env.NODE_ENV ??
  "development") as keyof typeof config;
const dbConfig = config[environment];
const dbPort =
  typeof dbConfig.port === "string"
    ? Number.parseInt(dbConfig.port, 10)
    : dbConfig.port;

const sessionPgPool = new Pool({
  host: dbConfig.host,
  port: dbPort,
  user: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
});

sessionPgPool.on("error", (err: Error) => {
  console.error("Error in PostgreSQL session pool:", err);
});

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required.");
}

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(cookieParser());
app.use(
  session({
    store: new PgSessionStore({
      pool: sessionPgPool,
      tableName: "session",
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
    },
  }),
);
app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP. Please try again after 15 minutes.",
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const corsOptions: CorsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import apiRoutes from "./routes/index.js";

app.use("/api/auth", authLimiter);

app.use("/api", apiRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: `Server is running on http://localhost:${PORT}`,
    timestamp: new Date().toLocaleTimeString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toLocaleTimeString(),
    environment: process.env.NODE_ENV || "development",
  });
});

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

const isHttpError = (error: unknown): error is HttpError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
};

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error occurred:", err);

  let statusCode = 500;
  let message = "Internal Server Error";

  if (isHttpError(err)) {
    statusCode = err.status ?? err.statusCode ?? statusCode;
    message = err.message || message;

    if (err.name === "UnauthorizedError" || err.name === "ForbiddenError") {
      statusCode = err.statusCode ?? statusCode;
      message = err.message;
    }
  }

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
    },
  });
});

// Start the server, assuming migrations have been run and the database is ready.
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
