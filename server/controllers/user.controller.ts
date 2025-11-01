import type { NextFunction, Request, Response } from "express";
import type { Session, SessionData } from "express-session";
import { Op } from "sequelize";

import db from "../models/index.js";

type Identifier = number | string;

interface UserAttributes extends Record<string, unknown> {
  user_id: Identifier;
  username?: string;
  email?: string;
  role?: string;
  password?: string;
}

interface UserInstance extends UserAttributes {
  update: (values: Record<string, unknown>) => Promise<void>;
}

interface UserModel {
  findByPk: (
    id: unknown,
    options?: Record<string, unknown>,
  ) => Promise<UserInstance | null>;
  findOne: (options: Record<string, unknown>) => Promise<UserInstance | null>;
}

interface DbModelMap {
  users?: unknown;
}

const models = db as DbModelMap;

const getModel = <T>(model: unknown, modelName: string): T => {
  if (
    typeof model !== "object" ||
    model === null ||
    typeof (model as { findByPk?: unknown }).findByPk !== "function"
  ) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }

  return model as T;
};

const Users = getModel<UserModel>(models.users, "users");

type SessionWithUser = Session & Partial<SessionData>;

interface UserSuccessResponse<T> {
  status: "success";
  message: string;
  data: T;
}

interface UserFailResponse {
  status: "fail" | "error";
  message: string;
  errors?: Record<string, string[]>;
}

const parseUserId = (value: unknown): number | null => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = parseUserId(req.params.id);

    if (!userId) {
      const response: UserFailResponse = {
        status: "fail",
        message: "Invalid user ID provided",
      };
      res.status(400).json(response);
      return;
    }

    const user = await Users.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      const response: UserFailResponse = {
        status: "fail",
        message: "User not found",
      };
      res.status(404).json(response);
      return;
    }

    const response: UserSuccessResponse<{ user: UserInstance }> = {
      status: "success",
      message: "User profile fetched successfully",
      data: { user },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    next(error);
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = parseUserId(req.params.id);
    const session = req.session as SessionWithUser | undefined;

    if (!userId) {
      const response: UserFailResponse = {
        status: "fail",
        message: "Invalid user ID provided",
      };
      res.status(400).json(response);
      return;
    }

    if (!session || (session.role !== "admin" && session.user_id !== userId)) {
      const response: UserFailResponse = {
        status: "fail",
        message: "Access denied. You can only update your own profile",
      };
      res.status(403).json(response);
      return;
    }

    const { first_name, last_name, bio, profile_picture_url, username, email } =
      req.body as Record<string, unknown>;

    if (typeof username === "string") {
      const existingUser = await Users.findOne({
        where: {
          username,
          user_id: { [Op.ne]: userId },
        },
      });
      if (existingUser) {
        const response: UserFailResponse = {
          status: "fail",
          message: "Validation errors",
          errors: {
            username: ["Username is already taken"],
          },
        };
        res.status(422).json(response);
        return;
      }
    }

    if (typeof email === "string") {
      const existingUser = await Users.findOne({
        where: {
          email,
          user_id: { [Op.ne]: userId },
        },
      });
      if (existingUser) {
        const response: UserFailResponse = {
          status: "fail",
          message: "Validation errors",
          errors: {
            email: ["Email is already taken"],
          },
        };
        res.status(422).json(response);
        return;
      }
    }

    const user = await Users.findByPk(userId);
    if (!user) {
      const response: UserFailResponse = {
        status: "fail",
        message: "User not found",
      };
      res.status(404).json(response);
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (bio !== undefined) updateData.bio = bio;
    if (profile_picture_url !== undefined)
      updateData.profile_picture_url = profile_picture_url;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;

    await user.update(updateData);

    const updatedUser = await Users.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    const response: UserSuccessResponse<{ user: UserInstance | null }> = {
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating user profile:", error);
    next(error);
  }
};
