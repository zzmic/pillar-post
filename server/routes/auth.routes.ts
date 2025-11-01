import { Router } from "express";

import {
  logInValidationRules,
  signUpValidationRules,
  validate,
} from "../middleware/validation.middleware.js";
import { logIn, logOut, signUp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", signUpValidationRules(), validate, signUp);

router.post("/login", logInValidationRules(), validate, logIn);

router.post("/logout", logOut);

export default router;
