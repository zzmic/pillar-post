const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../config/db.config.js");

// Create a new `Sequelize` instance with the database configuration that represents the connection to the database.
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};
// Store the `Sequelize` class itself and the initialized `Sequelize` connection instance in the `db` object.
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import and initialize the user model, associating it with the `Sequelize` instance and `DataTypes`,
// which allows the model to define a table structure associated with this specific database connection.
db.user = require("./user.model.js")(sequelize, DataTypes);

module.exports = db;
