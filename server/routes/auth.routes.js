import express from "express";
const router = express.Router();

import {
  validate,
  signUpValidationRules,
  logInValidationRules,
} from "../middleware/validation.middleware.js";
import { signUp, logIn, logOut } from "../controllers/auth.controller.js";

// POST /api/auth/signup - User registration
router.post("/signup", signUpValidationRules(), validate, signUp);

// POST /api/auth/login - User login
router.post("/login", logInValidationRules(), validate, logIn);

// POST /api/auth/logout - User logout
router.post("/logout", logOut);

export default router;
