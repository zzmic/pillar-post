const { body, validationResult } = require("express-validator");

// Middleware to validate request data using `express-validator`.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
  return res.status(422).json({
    status: "fail",
    message: "Validation errors",
    errors: extractedErrors,
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

module.exports = {
  validate,
  signUpValidationRules,
  logInValidationRules,
};
