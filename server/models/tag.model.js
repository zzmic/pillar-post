export default (sequelize, DataTypes) => {
  const Tags = sequelize.define(
    "tags",
    {
      tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
    },
    {
      timestamps: false,
      tableName: "tags",
    }
  );

  return Tags;
};
