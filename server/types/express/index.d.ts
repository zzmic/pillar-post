type Identifier = string | number;

declare global {
  namespace Express {
    interface AuthenticatedUser {
      user_id: Identifier;
      role?: string;
    }

    interface Request {
      user?: AuthenticatedUser;
      category?: Record<string, unknown>;
      comment?: Record<string, unknown>;
      tag?: Record<string, unknown>;
    }

    interface Response {
      post?: Record<string, unknown>;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    user_id?: Identifier;
    role?: string;
  }
}

export {};
