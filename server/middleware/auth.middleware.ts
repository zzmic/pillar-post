import type { NextFunction, Request, Response } from "express";
import type { Session, SessionData } from "express-session";

type SessionWithUser = Session & Partial<SessionData>;

interface HttpError extends Error {
  statusCode?: number;
}

const createHttpError = (message: string, statusCode: number): HttpError => {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
};

const ensureUser = (req: Request): Express.AuthenticatedUser | null => {
  const user = req.user ?? null;
  if (!user) {
    return null;
  }

  return {
    user_id: user.user_id,
    role: user.role,
  } satisfies Express.AuthenticatedUser;
};

export const isAuthenticated = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const session = req.session as SessionWithUser | undefined;

  if (session?.user_id) {
    req.user = {
      user_id: session.user_id,
      role: session.role,
    } satisfies Express.AuthenticatedUser;
    next();
    return;
  }

  next(createHttpError("Authentication required: Please sign in", 401));
};

export const isAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const user = ensureUser(req);

  if (user?.role === "admin") {
    next();
    return;
  }

  next(createHttpError("Access denied. Admins only", 403));
};

export const isAuthor = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const user = ensureUser(req);

  if (user && (user.role === "author" || user.role === "admin")) {
    next();
    return;
  }

  next(createHttpError("Access denied. Authors or admins only", 403));
};

export const isSubscriber = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const user = ensureUser(req);

  if (
    user &&
    (user.role === "subscriber" ||
      user.role === "author" ||
      user.role === "admin")
  ) {
    next();
    return;
  }

  next(
    createHttpError("Access denied. Subscribers, authors, or admins only", 403),
  );
};
