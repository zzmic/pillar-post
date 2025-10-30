export default (sequelize, DataTypes) => {
  const Categories = sequelize.define(
    "categories",
    {
      category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
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
      tableName: "categories",
    },
  );

  return Categories;
};
