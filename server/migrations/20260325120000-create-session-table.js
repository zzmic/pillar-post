"use strict";

/**
 * Session store for express-session via connect-pg-simple.
 * Schema matches <https://github.com/voxpelli/node-connect-pg-simple/blob/main/table.sql>.
 *
 * @type {import('sequelize-cli').Migration}
 */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      );

      ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

      CREATE INDEX "IDX_session_expire" ON "session" ("expire");
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("session");
  },
};
