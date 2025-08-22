import bcrypt from "bcrypt";

export default (sequelize, DataTypes) => {
  const Users = sequelize.define(
    "users",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          len: [1, 100],
          is: /^[a-zA-Z0-9._-]+$/,
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "author", "subscriber"),
        defaultValue: "subscriber",
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: [1, 100],
          is: /^[a-zA-Z\s\-']+$/,
        },
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: [1, 100],
          is: /^[a-zA-Z\s\-']+$/,
        },
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 1000],
        },
      },
      profile_picture_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
          len: [0, 500],
        },
      },
    },
    {
      timestamps: true,
      tableName: "users",
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  return Users;
};
