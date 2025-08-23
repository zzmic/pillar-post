import { body, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";

// Middleware function to validate request data.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
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

// Middleware function to validate user sign-up data.
const signUpValidationRules = () => {
  return [
    body("username")
      .isLength({ min: 1, max: 100 })
      .withMessage("Username must be between 1 and 100 characters")
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage(
        "Username can only contain letters, numbers, dots, underscores, or hyphens"
      ),
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

// Middleware function to validate user log-in data.
const logInValidationRules = () => {
  return [
    body("identifier").notEmpty().withMessage("Username or email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

// Middleware function to validate post data.
const postValidationRules = () => {
  return [
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ min: 1, max: 255 })
      .withMessage("Title must be between 1 and 255 characters"),
    body("body")
      .notEmpty()
      .withMessage("Content is required")
      .customSanitizer((value) => sanitizeHtml(value)),
    body("slug")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Slug must be between 1 and 100 characters")
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .withMessage(
        "Slug must contain only lowercase letters, numbers, and hyphens"
      ),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["draft", "published"])
      .withMessage("Status must be either 'draft' or 'published'"),
  ];
};

const commentValidationRules = (includeParentId = true) => {
  const rules = [
    body("commentBody")
      .notEmpty()
      .withMessage("Comment body is required")
      .isLength({ min: 1, max: 1000 })
      .withMessage("Comment must be between 1 and 1000 characters")
      .customSanitizer((value) => {
        return sanitizeHtml(value, {
          allowedTags: [
            "p",
            "br",
            "strong",
            "em",
            "u",
            "a",
            "ul",
            "ol",
            "li",
            "blockquote",
            "code",
          ],
          allowedAttributes: {
            a: ["href"],
          },
          allowedSchemes: ["http", "https", "mailto"],
        });
      }),
  ];
  if (includeParentId) {
    rules.push(
      body("parentCommentId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Parent comment ID must be a positive integer")
    );
  }

  return rules;
};

// Function to validate comment updates (for convenience).
const commentUpdateValidationRules = () => commentValidationRules(false);

// Middleware function to validate category data.
const categoryValidationRules = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Category name is required")
      .isLength({ min: 2, max: 255 })
      .withMessage("Category name must be between 2 and 255 characters")
      .trim()
      .escape(),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters")
      .trim()
      .escape(),
    body("slug")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Slug must be between 1 and 100 characters")
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .withMessage(
        "Slug must contain only lowercase letters, numbers, and hyphens"
      ),
  ];
};

// Middleware function to validate category update data (allowing partial updates).
const categoryUpdateValidationRules = () => {
  return [
    body("name")
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage("Name must be between 1 and 255 characters")
      .trim()
      .escape(),
    body("slug")
      .optional()
      .isSlug()
      .withMessage("Invalid slug format")
      .isLength({ min: 1, max: 100 })
      .withMessage("Slug must be between 1 and 100 characters"),
  ];
};

// Middleware function to validate tag data.
const tagValidationRules = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Tag name is required")
      .isLength({ min: 1, max: 100 })
      .withMessage("Tag name must be between 1 and 100 characters")
      .trim()
      .escape(),
    body("slug")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Slug must be between 1 and 100 characters")
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .withMessage(
        "Slug must contain only lowercase letters, numbers, and hyphens"
      ),
  ];
};

// Middleware function to validate tag update data.
const tagUpdateValidationRules = () => {
  return [
    body("name")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Tag name must be between 1 and 100 characters")
      .trim()
      .escape(),
    body("slug")
      .optional()
      .isSlug()
      .withMessage("Invalid slug format")
      .isLength({ min: 1, max: 100 })
      .withMessage("Slug must be between 1 and 100 characters"),
  ];
};

// Middleware function to validate profile update data.
const profileUpdateValidationRules = () => {
  return [
    body("username")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Username must be between 1 and 100 characters")
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage(
        "Username can only contain letters, numbers, dots, underscores, or hyphens"
      ),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("bio")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Bio must not exceed 1000 characters"),
    body("profile_picture_url")
      .optional()
      .isURL()
      .withMessage("Invalid URL format")
      .isLength({ max: 500 })
      .withMessage("Profile picture URL must not exceed 500 characters"),
    body("first_name")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("First name must be between 1 and 100 characters")
      .matches(/^[a-zA-Z\s\-']+$/)
      .withMessage(
        "First name can only contain letters, spaces, hyphens, or apostrophes"
      ),
    body("last_name")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Last name must be between 1 and 100 characters")
      .matches(/^[a-zA-Z\s\-']+$/)
      .withMessage(
        "Last name can only contain letters, spaces, hyphens, or apostrophes"
      ),
  ];
};

export {
  validate,
  signUpValidationRules,
  logInValidationRules,
  postValidationRules,
  commentValidationRules,
  commentUpdateValidationRules,
  categoryValidationRules,
  categoryUpdateValidationRules,
  tagValidationRules,
  tagUpdateValidationRules,
  profileUpdateValidationRules,
};
