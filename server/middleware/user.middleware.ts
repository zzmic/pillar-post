import type { NextFunction, Request, Response } from "express";
import type { Session, SessionData } from "express-session";

type SessionWithUser = Session & Partial<SessionData>;

interface UserParams {
  id?: string;
}

type UserRequest = Request<UserParams> & {
  session?: SessionWithUser;
};

const parseUserId = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const isValidUserId = (value: number | null): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
};

const normalizeSessionUserId = (
  value: SessionData["user_id"],
): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    return parseUserId(value);
  }

  return null;
};

export const canUpdateProfile = (
  req: UserRequest,
  res: Response,
  next: NextFunction,
): void => {
  const session = req.session as SessionWithUser | undefined;
  const sessionUserId = normalizeSessionUserId(session?.user_id);
  const userRole = session?.role;
  const targetUserId = parseUserId(req.params.id);

  if (!isValidUserId(targetUserId)) {
    res.status(400).json({
      status: "fail",
      message: "Invalid user ID provided",
    });
    return;
  }

  if (userRole === "admin") {
    next();
    return;
  }

  if (sessionUserId !== targetUserId) {
    res.status(403).json({
      status: "fail",
      message: "You can only update your own profile",
    });
    return;
  }

  next();
};

export const validateUserId = (
  req: Request<UserParams>,
  res: Response,
  next: NextFunction,
): void => {
  const userId = parseUserId(req.params.id);

  if (!isValidUserId(userId)) {
    res.status(400).json({
      status: "fail",
      message: "Invalid user ID provided",
    });
    return;
  }

  next();
};
