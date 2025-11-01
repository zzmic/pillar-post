import type { NextFunction, Request, Response } from "express";
import type { Session, SessionData } from "express-session";
import { Op } from "sequelize";

import db from "../models/index.js";
import { comparePassword, hashPassword } from "../utils/auth.utils.js";

type Identifier = number | string;

interface UserAttributes extends Record<string, unknown> {
  user_id: Identifier;
  username: string;
  email: string;
  role?: string;
  password?: string;
}

interface UserModel {
  findOne: (options: Record<string, unknown>) => Promise<UserAttributes | null>;
  findByPk: (id: unknown) => Promise<UserAttributes | null>;
  create: (values: Record<string, unknown>) => Promise<UserAttributes>;
}

interface DbModelMap {
  users?: unknown;
}

const models = db as DbModelMap;

const getModel = <T>(model: unknown, modelName: string): T => {
  if (
    typeof model !== "object" ||
    model === null ||
    typeof (model as { findOne?: unknown }).findOne !== "function"
  ) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }

  return model as T;
};

const Users = getModel<UserModel>(models.users, "users");

type SessionWithUser = Session & Partial<SessionData>;

interface UserPayload {
  user_id: Identifier;
  username: string;
  email: string;
  role?: string;
}

interface AuthSuccessResponse {
  status: "success";
  message: string;
  data?: {
    user: UserPayload;
  };
}

interface FailResponse {
  status: "fail";
  message: string;
}

interface SignUpBody {
  username: string;
  email: string;
  password: string;
  role?: string;
}

interface LogInBody {
  identifier: string;
  password: string;
}

const ensureSession = (
  session: Session | null | undefined,
): SessionWithUser => {
  if (!session) {
    throw new Error("Session is not initialized.");
  }

  return session as SessionWithUser;
};

const mapUserPayload = (user: UserAttributes): UserPayload => {
  return {
    user_id: user.user_id,
    username: String(user.username),
    email: String(user.email),
    role: user.role ? String(user.role) : undefined,
  };
};

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username, email, password, role } = req.body as Partial<SignUpBody>;

    if (!username || !email || !password) {
      const response: FailResponse = {
        status: "fail",
        message: "Username, email, and password are required.",
      };
      res.status(400).json(response);
      return;
    }

    const userByUsername = await Users.findOne({
      where: { username },
    });
    if (userByUsername) {
      const response: FailResponse = {
        status: "fail",
        message: "Username has already been taken",
      };
      res.status(409).json(response);
      return;
    }

    const userByEmail = await Users.findOne({ where: { email } });
    if (userByEmail) {
      const response: FailResponse = {
        status: "fail",
        message: "Email has already been taken",
      };
      res.status(409).json(response);
      return;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await Users.create({
      username,
      email,
      password: hashedPassword,
      role: role ?? "subscriber",
    });

    const response: AuthSuccessResponse = {
      status: "success",
      message: "User registered successfully",
      data: {
        user: mapUserPayload(newUser),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error during sign-up:", error);
    next(error);
  }
};

export const logIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { identifier, password } = req.body as Partial<LogInBody>;

    if (!identifier || !password) {
      const response: FailResponse = {
        status: "fail",
        message: "Identifier and password are required.",
      };
      res.status(400).json(response);
      return;
    }

    const user = await Users.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user || typeof user.password !== "string") {
      const response: FailResponse = {
        status: "fail",
        message: "Invalid credentials: user not found",
      };
      res.status(401).json(response);
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const response: FailResponse = {
        status: "fail",
        message: "Invalid credentials: password is incorrect",
      };
      res.status(401).json(response);
      return;
    }

    const session = ensureSession(req.session);

    session.user_id = user.user_id;
    session.role = user.role;

    await new Promise<void>((resolve, reject) => {
      session.save((saveError) => {
        if (saveError) {
          reject(saveError);
        } else {
          resolve();
        }
      });
    });

    const response: AuthSuccessResponse = {
      status: "success",
      message: "Logged in successfully",
      data: {
        user: mapUserPayload(user),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error during log-in:", error);
    next(error);
  }
};

export const logOut = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const session = req.session as SessionWithUser | undefined;

    if (!session) {
      const response: AuthSuccessResponse = {
        status: "success",
        message: "Logged out successfully",
      };
      res.status(200).json(response);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      session.destroy((destroyError) => {
        if (destroyError) {
          reject(destroyError);
        } else {
          resolve();
        }
      });
    });

    res.clearCookie("connect.sid", {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    const response: AuthSuccessResponse = {
      status: "success",
      message: "Logged out successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error during log-out:", error);
    next(error);
  }
};
