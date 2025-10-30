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
        underscored: true, // Use snake_case for column names.
        underscoredAll: true, // Use snake_case for all identifiers.
      },
    },
  );
}

// Initialize models function.
async function initializeModels() {
  // Read all files in the current directory, excluding the current file and test files, and import them as models.
  const files = fs.readdirSync(__dirname).filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  });

  for (const file of files) {
    const { default: modelDefinition } = await import(`./${file}`);
    const model = modelDefinition(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  }

  return db;
}

await initializeModels();

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Store the `Sequelize` class itself and the initialized `Sequelize` connection instance in the `db` object.
db.sequelize = sequelize;
db.Sequelize = Sequelize;

/* Define associations between models. */
// Users <-> Posts (one-to-many).
db.users.hasMany(db.posts, {
  foreignKey: "user_id",
  onDelete: "SET NULL",
  as: "posts",
});
db.posts.belongsTo(db.users, {
  foreignKey: "user_id",
  as: "author",
});

// Users <-> Comments (one-to-many).
db.users.hasMany(db.comments, {
  foreignKey: "user_id",
  onDelete: "SET NULL",
  as: "comments",
});
db.comments.belongsTo(db.users, {
  foreignKey: "user_id",
  as: "commenter",
});

// Posts <-> Comments (one-to-many).
db.posts.hasMany(db.comments, {
  foreignKey: "post_id",
  onDelete: "CASCADE",
  as: "comments",
});
db.comments.belongsTo(db.posts, {
  foreignKey: "post_id",
  as: "post",
});

// Comments <-> Comments (self-referential association for replies;
// one-to-many for threaded comments).
db.comments.hasMany(db.comments, {
  foreignKey: "parent_comment_id",
  as: "replies",
  onDelete: "CASCADE",
});
db.comments.belongsTo(db.comments, {
  foreignKey: "parent_comment_id",
  as: "parentComment",
});

// Posts <-> Categories (many-to-many association through `post_categories` (join table)).
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

// Posts <-> Tags (many-to-many association through `post_tags` (join table)).
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

export default db;
