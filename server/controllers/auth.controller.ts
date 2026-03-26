import type { NextFunction, Request, Response } from "express";
import type { Session, SessionData } from "express-session";
import { Op } from "sequelize";

import { comparePassword, hashPassword } from "../utils/auth.utils.js";
import { sendApiError } from "../utils/api-envelope.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";

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

const getUsers = (): UserModel => getSequelizeModel<UserModel>("users");

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

interface SignUpBody {
  username: string;
  email: string;
  password: string;
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
    const { username, email, password } = req.body as Partial<SignUpBody>;

    if (!username || !email || !password) {
      sendApiError(res, 400, "Username, email, and password are required.");
      return;
    }

    const userByUsername = await getUsers().findOne({
      where: { username },
    });
    if (userByUsername) {
      sendApiError(res, 409, "Username has already been taken");
      return;
    }

    const userByEmail = await getUsers().findOne({ where: { email } });
    if (userByEmail) {
      sendApiError(res, 409, "Email has already been taken");
      return;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await getUsers().create({
      username,
      email,
      password: hashedPassword,
      role: "subscriber",
    });

    const response: AuthSuccessResponse = {
      status: "success",
      message: "User registered",
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
      sendApiError(res, 400, "Identifier and password are required.");
      return;
    }

    const user = await getUsers().findOne({
      where: {
        [Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user || typeof user.password !== "string") {
      sendApiError(res, 401, "Invalid credentials: user not found");
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      sendApiError(res, 401, "Invalid credentials: password is incorrect");
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
      message: "Logged in",
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
        message: "Logged out",
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
      message: "Logged out",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error during log-out:", error);
    next(error);
  }
};
