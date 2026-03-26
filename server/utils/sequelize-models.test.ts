import { describe, it, expect, beforeEach, vi } from "vitest";

const dbMock = vi.hoisted(() => {
  const sequelizeModels: Record<string, unknown> = {};
  const root: Record<string, unknown> & {
    sequelize: { models: Record<string, unknown> };
  } = {
    sequelize: {
      get models() {
        return sequelizeModels;
      },
    },
  };
  return { root, sequelizeModels };
});

vi.mock("../models/index.js", () => ({
  default: dbMock.root,
}));

import { getSequelizeModel } from "./sequelize-models.js";

describe("sequelize-models", () => {
  const usersModel = { name: "users" };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(dbMock.sequelizeModels).forEach((key) => {
      delete dbMock.sequelizeModels[key];
    });
    for (const key of [
      "users",
      "posts",
      "categories",
      "tags",
      "comments",
    ] as const) {
      delete dbMock.root[key];
    }
  });

  describe("getSequelizeModel", () => {
    it("returns the model from sequelize.models when present", () => {
      dbMock.sequelizeModels.users = usersModel;

      const result = getSequelizeModel<typeof usersModel>("users");

      expect(result).toBe(usersModel);
    });

    it("falls back to the root db object when sequelize.models omits the key", () => {
      dbMock.root.posts = usersModel;

      const result = getSequelizeModel<typeof usersModel>("posts");

      expect(result).toBe(usersModel);
    });

    it("prefers sequelize.models over the root property when both are set", () => {
      const fromSequelize = { id: "sequelize" };
      const fromRoot = { id: "root" };
      dbMock.sequelizeModels.categories = fromSequelize;
      dbMock.root.categories = fromRoot;

      const result = getSequelizeModel<{ id: string }>("categories");

      expect(result).toBe(fromSequelize);
    });

    it("accepts a constructor function as a valid model", () => {
      function PostsModel() {}
      dbMock.sequelizeModels.posts = PostsModel;

      const result = getSequelizeModel<typeof PostsModel>("posts");

      expect(result).toBe(PostsModel);
    });

    it("throws when the model is missing", () => {
      expect(() => getSequelizeModel("tags")).toThrow(
        "Model 'tags' is not available on the database instance.",
      );
    });

    it("throws when the model is null", () => {
      dbMock.sequelizeModels.comments = null;

      expect(() => getSequelizeModel("comments")).toThrow(
        "Model 'comments' is not available on the database instance.",
      );
    });

    it("throws when the resolved value is a primitive", () => {
      dbMock.root.users = "not-a-model" as unknown;

      expect(() => getSequelizeModel("users")).toThrow(
        "Model 'users' is not available on the database instance.",
      );
    });
  });
});
