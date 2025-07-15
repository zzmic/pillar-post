const express = require("express");
const router = express.Router();
const { hashPassword, comparePassword } = require("../utils/auth.utils");
const {
  validate,
  signUpValidationRules,
  logInValidationRules,
} = require("../middleware/validation.middleware");
const db = require("../models");
const User = db.User;

router.post("/sign-up", signUpValidationRules(), validate, async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Check if the username has already been taken (using Sequelize syntax).
    let userByUsername = await User.findOne({ where: { username: username } });
    if (userByUsername) {
      return res.status(409).json({
        status: "fail",
        message: "Username has already been taken.",
      });
    }

    // Check if the email has already been taken.
    let userByEmail = await User.findOne({ where: { email: email } });
    if (userByEmail) {
      return res.status(409).json({
        status: "fail",
        message: "Email has already been taken.",
      });
    }

    // Hash the password before saving it to the database.
    const hashedPassword = await hashPassword(password);

    // Create a new user instance.
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Respond with the newly created user data (excluding the password).
    res.status(201).json({
      status: "success",
      message: "User registered successfully. Please sign in.",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Error during sign-up:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error during sign-up.",
    });
  }
});

router.post("/log-in", logInValidationRules(), validate, async (req, res) => {
  const { identifier, password } = req.body; // 'identifier' can be username or email
  try {
    // Find the user by either username or email.
    const user = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });

    // Check if the user exists.
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid credentials: user not found.",
      });
    }

    // Compare the provided password with the stored hashed password.
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid credentials: password is incorrect.",
      });
    }

    // If the credentials are valid, set the user ID and role in the session.
    req.session.userId = user.user_id;
    req.session.role = user.role;

    // Save the session explicitly. This is important if you're using an external session store
    // (like connect-pg-simple) and want to ensure the session is written before responding.
    await req.session.save();

    res.status(200).json({
      status: "success",
      message: "Logged in successfully.",
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role, // Include role for frontend to manage permissions
      },
    });
  } catch (err) {
    console.error("Error during log-in:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error during log-in.",
    });
  }
});

router.post("/log-out", (req, res, next) => {
  // Destroy the session to log out the user.
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during log-out:", err);
      return next(new Error("Failed to destroy session")); // Pass the error to the error handler.
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
});

module.exports = router;
