const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = {
      userId: req.session.userId,
      role: req.session.role,
    };
    next();
  } else {
    const error = new Error("Authentication required: Please sign in.");
    error.statusCode = 401;
    next(error);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    const error = new Error("Access denied. Admins only.");
    error.statusCode = 403;
    next(error);
  }
};

const isAuthor = (req, res, next) => {
  if ((req.user && req.user.role === "author") || req.user.role === "admin") {
    next();
  } else {
    const error = new Error("Access denied. Authors or admins only.");
    error.statusCode = 403;
    next(error);
  }
};

const isSubscriber = (req, res, next) => {
  if (
    (req.user && req.user.role === "subscriber") ||
    req.user.role === "author" ||
    req.user.role === "admin"
  ) {
    next();
  } else {
    const error = new Error(
      "Access denied. Subscribers, authors, or admins only."
    );
    error.statusCode = 403;
    next(error);
  }
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isAuthor,
  isSubscriber,
};
