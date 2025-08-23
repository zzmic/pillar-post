import db from "../models/index.js";
const Users = db.users;

/**
 * Get a user's profile.
 * @route GET /api/users/:user_id/profile
 * @access Public
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user_id = parseInt(req.params.id);

    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid user ID provided",
      });
    }

    const user = await Users.findByPk(user_id, {
      attributes: {
        exclude: ["password"],
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User profile fetched successfully",
      data: {
        user,
      },
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    next(err);
  }
};

/**
 * Update a user's profile.
 * @route PUT /api/users/:user_id/profile
 * @access Private (User only)
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user_id = parseInt(req.params.id);
    const authenticated_user_id = req.session.user_id;

    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid user ID provided",
      });
    }

    if (user_id !== authenticated_user_id) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied. You can only update your own profile",
      });
    }

    const { first_name, last_name, bio, profile_picture_url, username, email } =
      req.body;

    if (username) {
      const existingUser = await Users.findOne({
        where: {
          username,
          user_id: { [db.Sequelize.Op.ne]: user_id },
        },
      });
      if (existingUser) {
        return res.status(422).json({
          status: "fail",
          message: "Validation errors",
          errors: {
            username: ["Username is already taken"],
          },
        });
      }
    }

    if (email) {
      const existingUser = await Users.findOne({
        where: {
          email,
          user_id: { [db.Sequelize.Op.ne]: user_id },
        },
      });
      if (existingUser) {
        return res.status(422).json({
          status: "fail",
          message: "Validation errors",
          errors: {
            email: ["Email is already taken"],
          },
        });
      }
    }

    const user = await Users.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (bio !== undefined) updateData.bio = bio;
    if (profile_picture_url !== undefined)
      updateData.profile_picture_url = profile_picture_url;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;

    await user.update(updateData);

    const updatedUser = await Users.findByPk(user_id, {
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    next(err);
  }
};

export { getUserProfile, updateUserProfile };
