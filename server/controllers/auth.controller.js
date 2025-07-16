const { hashPassword, comparePassword } = require("../utils/auth.utils");
const db = require("../models");
const User = db.users;

// Controller to handle a user sign-up.
const signUp = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const userByUsername = await User.findOne({ where: { username } });
    if (userByUsername) {
      return res.status(409).json({
        status: "fail",
        message: "Username has already been taken.",
      });
    }
    const userByEmail = await User.findOne({ where: { email } });
    if (userByEmail) {
      return res.status(409).json({
        status: "fail",
        message: "Email has already been taken.",
      });
    }
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    res.status(201).json({
      status: "success",
      message: "User registered successfully.",
      data: {
        user: {
          id: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      },
    });
  } catch (err) {
    console.error("Error during sign-up:", err);
    next(err);
  }
};

// Controller to handle a user login.
const logIn = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const db = require("../models");
    const user = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid credentials: user not found.",
      });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid credentials: password is incorrect.",
      });
    }
    req.session.userId = user.user_id;
    req.session.role = user.role;
    await req.session.save();
    res.status(200).json({
      status: "success",
      message: "Logged in successfully.",
      data: {
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error("Error during log-in:", err);
    next(err);
  }
};

// Controller to handle a user logout.
const logOut = async (req, res, next) => {
  try {
    // Destroy the session to log out the user
    req.session.destroy((err) => {
      if (err) {
        console.error("Error during log-out:", err);
        return next(new Error("Failed to destroy session"));
      }
      res.clearCookie("connect.sid", {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
      });
      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
    });
  } catch (err) {
    console.error("Error during log-out:", err);
    next(err);
  }
};

module.exports = {
  signUp,
  logIn,
  logOut,
};
