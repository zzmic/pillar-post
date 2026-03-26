import db from "../models/index.js";

export type SequelizeModelName =
  | "users"
  | "posts"
  | "categories"
  | "tags"
  | "comments";

export function getSequelizeModel<T>(modelName: SequelizeModelName): T {
  const record = db as Record<string, unknown>;
  const model =
    (db.sequelize?.models?.[modelName] as unknown) ?? record[modelName];
  if (
    (typeof model !== "object" && typeof model !== "function") ||
    model === null
  ) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }
  return model as T;
}
