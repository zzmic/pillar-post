// Middleware function to check if the user is authenticated.
const isAuthenticated = (req, next) => {
  if (req.session && req.session.user_id) {
    req.user = {
      user_id: req.session.user_id,
      role: req.session.role,
    };
    next();
  } else {
    const error = new Error("Authentication required: Please sign in");
    error.statusCode = 401;
    next(error);
  }
};

// Middleware function to check if the user has an admin role.
const isAdmin = (req, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    const error = new Error("Access denied. Admins only");
    error.statusCode = 403;
    next(error);
  }
};

// Middleware function to check if the user has an author or admin role.
const isAuthor = (req, next) => {
  if ((req.user && req.user.role === "author") || req.user.role === "admin") {
    next();
  } else {
    const error = new Error("Access denied. Authors or admins only");
    error.statusCode = 403;
    next(error);
  }
};

// Middleware function to check if the user has a subscriber role.
const isSubscriber = (req, next) => {
  if (
    (req.user && req.user.role === "subscriber") ||
    req.user.role === "author" ||
    req.user.role === "admin"
  ) {
    next();
  } else {
    const error = new Error(
      "Access denied. Subscribers, authors, or admins only"
    );
    error.statusCode = 403;
    next(error);
  }
};

export { isAuthenticated, isAdmin, isAuthor, isSubscriber };
