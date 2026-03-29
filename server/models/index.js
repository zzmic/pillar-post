"use strict";

import fs from "fs";
import path from "path";
import Sequelize from "sequelize";
import process from "process";
import { fileURLToPath } from "url";
import config from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];
const db = {};

// Create a new `Sequelize` instance with the database configuration that represents the connection to the database.
let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      ...dbConfig,
      define: {
        timestamps: true,
        underscored: true, // Use `snake_case` for column names.
        underscoredAll: true, // Use `snake_case` for all identifiers.
      },
    },
  );
}

// `db.sequelize` is the Sequelize instance that represents the connection to the database,
// while `db.Sequelize` is the Sequelize class imported from the `sequelize` package.
db.sequelize = sequelize;
db.Sequelize = Sequelize;

/**
 * Initialize models by reading all files in the current directory, excluding the current file and test files, and importing them as models.
 * Then, create a new model instance for each model and add it to the `db` object.
 * If the `sequelize.models` object is present, add the model to the `sequelize.models` object.
 * Finally, log the name of the model that was loaded.
 */
async function initializeModels() {
  const files = fs.readdirSync(__dirname).filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  });

  for (const file of files) {
    try {
      const { default: modelDefinition } = await import(`./${file}`);
      const model = modelDefinition(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      if (sequelize.models) {
        sequelize.models[model.name] = model;
      }
      console.log(`Loaded model: ${model.name}`);
    } catch (error) {
      console.error(`Error loading model from ${file}:`, error);
      throw error;
    }
  }

  return db;
}

/**
 * Run the `associate` method on each model (non-`sequelize` and non-`Sequelize` fields).
 * If the `associate` method is not present, skip the model by returning from the callback early.
 * If the `associate` method is present, call it with the `db` object and return from the callback.
 */
function runModelAssociates() {
  const skip = new Set(["sequelize", "Sequelize"]);
  Object.keys(db).forEach((modelName) => {
    if (skip.has(modelName)) return;
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });
}

/**
 * Define associations between models by calling the `associate` method on each model.
 * If the `associate` method is not present, skip the model by returning from the callback early.
 * If the `associate` method is present, call it with the `db` object and return from the callback.
 */
function defineAssociations() {
  // Users <-> Posts
  // (one-to-many).
  db.users.hasMany(db.posts, {
    foreignKey: "user_id",
    onDelete: "SET NULL",
    as: "posts",
  });
  db.posts.belongsTo(db.users, {
    foreignKey: "user_id",
    as: "author",
  });

  // Users <-> Comments
  // (one-to-many).
  db.users.hasMany(db.comments, {
    foreignKey: "user_id",
    onDelete: "SET NULL",
    as: "comments",
  });
  db.comments.belongsTo(db.users, {
    foreignKey: "user_id",
    as: "commenter",
  });

  // Posts <-> Comments
  // (one-to-many).
  db.posts.hasMany(db.comments, {
    foreignKey: "post_id",
    onDelete: "CASCADE",
    as: "comments",
  });
  db.comments.belongsTo(db.posts, {
    foreignKey: "post_id",
    as: "post",
  });

  // Comments <-> Comments
  // (self-referential association for replies; one-to-many for threaded comments).
  db.comments.hasMany(db.comments, {
    foreignKey: "parent_comment_id",
    as: "replies",
    onDelete: "CASCADE",
  });
  db.comments.belongsTo(db.comments, {
    foreignKey: "parent_comment_id",
    as: "parentComment",
  });

  // Posts <-> Categories
  // (many-to-many association through `post_categories` (join table)).
  db.posts.belongsToMany(db.categories, {
    through: "post_categories",
    foreignKey: "post_id",
    otherKey: "category_id",
    as: "categories",
  });
  db.categories.belongsToMany(db.posts, {
    through: "post_categories",
    foreignKey: "category_id",
    otherKey: "post_id",
    as: "posts",
  });

  // Posts <-> Tags
  // (many-to-many association through `post_tags` (join table)).
  db.posts.belongsToMany(db.tags, {
    through: "post_tags",
    foreignKey: "post_id",
    otherKey: "tag_id",
    as: "tags",
  });
  db.tags.belongsToMany(db.posts, {
    through: "post_tags",
    foreignKey: "tag_id",
    otherKey: "post_id",
    as: "posts",
  });
}

//
let initPromise = null;

/**
 * Authenticate the DB connection, load model files, run per-model `associate`, and register cross-model associations.
 * Call from application entry point (e.g. `index.ts`) before accepting traffic.
 * Idempotent: concurrent callers share one run.
 * If `initPromise` is not null, return the existing promise.
 * Otherwise, create a new promise and return it.
 */
export async function initDb() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await sequelize.authenticate();
      console.log("Database connection established.");

      await initializeModels();
      const modelNames = Object.keys(db).filter(
        (key) => key !== "sequelize" && key !== "Sequelize",
      );
      console.log("Models initialized. Available models:", modelNames);

      runModelAssociates();
      defineAssociations();
    } catch (error) {
      initPromise = null;
      console.error("Error initializing models or database connection:", error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Export the `db` object.
 */
export default db;
