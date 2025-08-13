import { hashPassword, comparePassword } from "../utils/auth.utils.js";
import db from "../models/index.js";
const Users = db.users;

// Function to handle user sign-up.
const signUp = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if the username has already been taken.
    const userByUsername = await Users.findOne({ where: { username } });
    if (userByUsername) {
      return res.status(409).json({
        status: "fail",
        message: "Username has already been taken.",
      });
    }

    // Check if the email has already been taken.
    const userByEmail = await Users.findOne({ where: { email } });
    if (userByEmail) {
      return res.status(409).json({
        status: "fail",
        message: "Email has already been taken.",
      });
    }

    // Hash the password before saving it to the database.
    const hashedPassword = await hashPassword(password);

    // Create a new user in the database.
    const newUser = await Users.create({
      username,
      email,
      password: hashedPassword,
      role: role || "subscriber", // Default the role to "subscriber" if no role is specified.
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

// Function to handle user log-in.
const logIn = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Find the user by the identifier (username or email).
    const user = await Users.findOne({
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

    // Verify the password against the stored hash.
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid credentials: password is incorrect.",
      });
    }

    // Create a session for the authenticated user.
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

// Function to handle user log-out.
const logOut = async (req, res, next) => {
  try {
    // Destroy the session to log out the user
    req.session.destroy((err) => {
      if (err) {
        console.error("Error during log-out:", err);
        return next(new Error("Failed to destroy session"));
      }

      // Clear the session cookie from the client.
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
