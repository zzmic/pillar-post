import type { NextFunction, Request, Response } from "express";
import type { Session, SessionData } from "express-session";
import { Op } from "sequelize";

import { sendApiError } from "../utils/api-envelope.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";

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

const getUsers = (): UserModel => getSequelizeModel<UserModel>("users");

type SessionWithUser = Session & Partial<SessionData>;

interface UserSuccessResponse<T> {
  status: "success";
  message: string;
  data: T;
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
      sendApiError(res, 400, "Invalid user ID provided");
      return;
    }

    const user = await getUsers().findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      sendApiError(res, 404, "User not found");
      return;
    }

    const response: UserSuccessResponse<{ user: UserInstance }> = {
      status: "success",
      message: "User profile fetched",
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
      sendApiError(res, 400, "Invalid user ID provided");
      return;
    }

    if (!session || (session.role !== "admin" && session.user_id !== userId)) {
      sendApiError(
        res,
        403,
        "Access denied. You can only update your own profile",
      );
      return;
    }

    const { first_name, last_name, bio, profile_picture_url, username, email } =
      req.body as Record<string, unknown>;

    if (typeof username === "string") {
      const existingUser = await getUsers().findOne({
        where: {
          username,
          user_id: { [Op.ne]: userId },
        },
      });
      if (existingUser) {
        sendApiError(res, 422, "Validation errors", {
          errors: { username: ["Username is already taken"] },
        });
        return;
      }
    }

    if (typeof email === "string") {
      const existingUser = await getUsers().findOne({
        where: {
          email,
          user_id: { [Op.ne]: userId },
        },
      });
      if (existingUser) {
        sendApiError(res, 422, "Validation errors", {
          errors: { email: ["Email is already taken"] },
        });
        return;
      }
    }

    const user = await getUsers().findByPk(userId);
    if (!user) {
      sendApiError(res, 404, "User not found");
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

    const updatedUser = await getUsers().findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    const response: UserSuccessResponse<{ user: UserInstance | null }> = {
      status: "success",
      message: "Profile updated",
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
