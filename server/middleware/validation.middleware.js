const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

// Middleware to validate request data using `express-validator`.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  // Format errors to a more readable structure.
  const formattedErrors = {};
  errors.array().forEach((err) => {
    const fieldName = err.param || err.path || "unknown";
    if (!formattedErrors[fieldName]) {
      formattedErrors[fieldName] = [];
    }
    formattedErrors[fieldName].push(err.msg);
  });
  return res.status(422).json({
    status: "fail",
    message: "Validation errors",
    errors: formattedErrors,
  });
};

// Middleware to validate user sign-up data.
const signUpValidationRules = () => {
  return [
    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters")
      .isAlphanumeric()
      .withMessage("Username must be alphanumeric"),
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
  ];
};

// Middleware to validate user log-in data.
const logInValidationRules = () => {
  return [
    body("identifier").notEmpty().withMessage("Username or email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

// Middleware to validate post data.
const postValidationRules = () => {
  return [
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ min: 3, max: 255 })
      .withMessage("Title must be between 3 and 255 characters"),
    body("body")
      .notEmpty()
      .withMessage("Content is required")
      .customSanitizer((value) => {
        return sanitizeHtml(value, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            "img",
            "iframe",
          ]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            iframe: [
              "src",
              "width",
              "height",
              "frameborder",
              "allowfullscreen",
              "sandbox",
            ],
          },
        });
      }),
    body("slug").optional().isSlug().withMessage("Invalid slug format"),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["draft", "published"])
      .withMessage("Status must be either 'draft' or 'published'"),
  ];
};

module.exports = {
  validate,
  signUpValidationRules,
  logInValidationRules,
  postValidationRules,
};
