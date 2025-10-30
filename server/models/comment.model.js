export default (sequelize, DataTypes) => {
  const Comments = sequelize.define(
    "comments",
    {
      comment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      parent_comment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("approved", "pending", "spam"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      timestamps: false,
      tableName: "comments",
    },
  );

  return Comments;
};
