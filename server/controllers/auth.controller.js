import db from "../models/index.js";
import { hashPassword, comparePassword } from "../utils/auth.utils.js";
const Users = db.users;

/**
 * Sign up a new user.
 * @route POST /api/auth/signup
 * @access Public
 */
const signUp = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const userByUsername = await Users.findOne({ where: { username } });
    if (userByUsername) {
      return res.status(409).json({
        status: "fail",
        message: "Username has already been taken.",
      });
    }

    const userByEmail = await Users.findOne({ where: { email } });
    if (userByEmail) {
      return res.status(409).json({
        status: "fail",
        message: "Email has already been taken.",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await Users.create({
      username,
      email,
      password: hashedPassword,
      role: role || "subscriber",
    });

    res.status(201).json({
      status: "success",
      message: "User registered successfully.",
      data: {
        user: {
          user_id: newUser.user_id,
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

/**
 * Log in a user.
 * @route POST /api/auth/login
 * @access Public
 */
const logIn = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const user = await Users.findOne({
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

    req.session.user_id = user.user_id;
    req.session.role = user.role;
    await req.session.save();

    res.status(200).json({
      status: "success",
      message: "Logged in successfully.",
      data: {
        user: {
          user_id: user.user_id,
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

/**
 * Log out a user.
 * @route POST /api/auth/logout
 * @access Public
 */
const logOut = async (req, res, next) => {
  try {
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

export { signUp, logIn, logOut };
