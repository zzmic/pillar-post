"use strict";

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    /**
     * Add profile fields to users table.
     */
    await queryInterface.addColumn("users", "first_name", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "last_name", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "bio", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "profile_picture_url", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "updated_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    /**
     * Remove profile fields from users table.
     */
    await queryInterface.removeColumn("users", "first_name");
    await queryInterface.removeColumn("users", "last_name");
    await queryInterface.removeColumn("users", "bio");
    await queryInterface.removeColumn("users", "profile_picture_url");
    await queryInterface.removeColumn("users", "updated_at");
  },
};
