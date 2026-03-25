import dotenv from "dotenv";
dotenv.config();

const DEFAULT_DB_BASE = "pillar_post";

/**
 * @param {"dev" | "test" | "prod"} suffix
 */
function databaseName(suffix) {
  const base = process.env.DB_NAME?.trim();
  if (base) {
    return `${base}_${suffix}`;
  }
  if (suffix === "prod" && process.env.NODE_ENV === "production") {
    throw new Error("DB_NAME environment variable is required in production (fail fast).");
  }
  return `${DEFAULT_DB_BASE}_${suffix}`;
}

export default {
  development: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName("dev"),
    dialect: "postgres",
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
  },
  test: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName("test"),
    dialect: "postgres",
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
  },
  production: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName("prod"),
    dialect: "postgres",
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
  },
};
