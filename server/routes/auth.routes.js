const express = require("express");
const router = express.Router();

const {
  validate,
  signUpValidationRules,
  logInValidationRules,
} = require("../middleware/validation.middleware");

const { signUp, logIn, logOut } = require("../controllers/auth.controller");

// POST /api/auth/sign-up - User registration
router.post("/sign-up", signUpValidationRules(), validate, signUp);

// POST /api/auth/log-in - User login
router.post("/log-in", logInValidationRules(), validate, logIn);

// POST /api/auth/log-out - User logout
router.post("/log-out", logOut);

module.exports = router;
