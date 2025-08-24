// Middleware function to ensure that a user can only access their own data.
const canUpdateProfile = (req, res, next) => {
  const sessionUserId = req.session.user_id;
  const targetUserId = parseInt(req.params.id);
  const userRole = req.session.role;

  if (!targetUserId || isNaN(targetUserId)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid user ID provided",
    });
  }

  // Admins can update any profile.
  if (userRole === "admin") {
    return next();
  }

  // Non-admin users can only update their own profile.
  if (sessionUserId !== targetUserId) {
    return res.status(403).json({
      status: "fail",
      message: "You can only update your own profile",
    });
  }

  next();
};

// Middleware function to validate that `:id` parameter is a valid user ID.
const validateUserId = (req, res, next) => {
  const userId = parseInt(req.params.id);

  // Check if the user ID is a valid number and greater than 0.
  if (!userId || isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid user ID provided",
    });
  }

  next();
};

export { canUpdateProfile, validateUserId };
