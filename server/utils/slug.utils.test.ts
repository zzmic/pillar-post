import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import {
  generateSlug,
  ensureUniquePostSlug,
  ensureUniqueCategorySlug,
  ensureUniqueTagSlug,
  validateSlugFormat,
  generateCategorySlugIfNeeded,
  generateTagSlugIfNeeded,
} from "./slug.utils.js";

// Mock the database models
vi.mock("../models/index.js", () => {
  const mockFindOne = vi.fn();
  return {
    default: {
      sequelize: {
        models: {
          posts: {
            findOne: mockFindOne,
          },
          categories: {
            findOne: mockFindOne,
          },
          tags: {
            findOne: mockFindOne,
          },
        },
      },
      posts: {
        findOne: mockFindOne,
      },
      categories: {
        findOne: mockFindOne,
      },
      tags: {
        findOne: mockFindOne,
      },
    },
  };
});

import db from "../models/index.js";

// Helper to get mocked findOne function
const getMockedFindOne = (modelName: "posts" | "categories" | "tags") => {
  const model =
    (
      db as unknown as {
        sequelize?: {
          models?: Record<string, { findOne: ReturnType<typeof vi.fn> }>;
        };
      }
    ).sequelize?.models?.[modelName] ||
    (db as unknown as Record<string, { findOne: ReturnType<typeof vi.fn> }>)[
      modelName
    ];
  return model?.findOne as ReturnType<typeof vi.fn>;
};

describe("slug.utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateSlug", () => {
    it("should generate a slug from a simple title", () => {
      const title = "Hello World";
      const result = generateSlug(title);

      expect(result).toBe("hello-world");
    });

    it("should convert to lowercase", () => {
      const title = "HELLO WORLD";
      const result = generateSlug(title);

      expect(result).toBe("hello-world");
    });

    it("should replace spaces with hyphens", () => {
      const title = "Hello World Test";
      const result = generateSlug(title);

      expect(result).toBe("hello-world-test");
    });

    it("should remove special characters", () => {
      const title = "Hello! World@ Test#";
      const result = generateSlug(title);

      expect(result).toBe("hello-world-test");
    });

    it("should handle multiple spaces", () => {
      const title = "Hello    World";
      const result = generateSlug(title);

      expect(result).toBe("hello-world");
    });

    it("should remove diacritics", () => {
      const title = "Café Résumé";
      const result = generateSlug(title);

      expect(result).toBe("cafe-resume");
    });

    it("should trim leading and trailing whitespace", () => {
      const title = "  Hello World  ";
      const result = generateSlug(title);

      expect(result).toBe("hello-world");
    });

    it("should collapse multiple hyphens", () => {
      const title = "Hello---World";
      const result = generateSlug(title);

      expect(result).toBe("hello-world");
    });

    it("should handle numbers", () => {
      const title = "Post 123";
      const result = generateSlug(title);

      expect(result).toBe("post-123");
    });

    it("should handle unicode characters", () => {
      const title = "Hello 世界";
      const result = generateSlug(title);

      // Unicode letters (like Chinese characters) are preserved as they match \p{L}
      // Only non-letter/number characters are removed
      expect(result).toBe("hello-世界");
    });

    it("should throw error for empty string", () => {
      expect(() => generateSlug("")).toThrow(
        "Invalid title provided for slug generation: it must be a non-empty string.",
      );
    });

    it("should throw error for whitespace-only string", () => {
      expect(() => generateSlug("   ")).toThrow(
        "Invalid title provided for slug generation: it must be a non-empty string.",
      );
    });

    it("should throw error for non-string input", () => {
      expect(() => generateSlug(null as unknown as string)).toThrow();
      expect(() => generateSlug(123 as unknown as string)).toThrow();
      expect(() => generateSlug(undefined as unknown as string)).toThrow();
    });
  });

  describe("ensureUniquePostSlug", () => {
    it("should return the slug if it is unique", async () => {
      const mockFindOne = getMockedFindOne("posts");
      mockFindOne.mockResolvedValue(null);

      const result = await ensureUniquePostSlug("test-slug");

      expect(result).toBe("test-slug");
      expect(mockFindOne).toHaveBeenCalledWith({
        where: { slug: "test-slug" },
      });
    });

    it("should append count when slug exists", async () => {
      const mockFindOne = getMockedFindOne("posts");
      mockFindOne
        .mockResolvedValueOnce({ post_id: 1 } as never)
        .mockResolvedValueOnce(null);

      const result = await ensureUniquePostSlug("test-slug");

      expect(result).toBe("test-slug-1");
      expect(mockFindOne).toHaveBeenCalledTimes(2);
    });

    it("should increment count for multiple collisions", async () => {
      const mockFindOne = getMockedFindOne("posts");
      mockFindOne
        .mockResolvedValueOnce({ post_id: 1 } as never)
        .mockResolvedValueOnce({ post_id: 2 } as never)
        .mockResolvedValueOnce(null);

      const result = await ensureUniquePostSlug("test-slug");

      expect(result).toBe("test-slug-2");
      expect(mockFindOne).toHaveBeenCalledTimes(3);
    });

    it("should exclude postId when checking uniqueness", async () => {
      const mockFindOne = getMockedFindOne("posts");
      mockFindOne.mockResolvedValue(null);

      await ensureUniquePostSlug("test-slug", 5);

      expect(mockFindOne).toHaveBeenCalledWith({
        where: {
          slug: "test-slug",
          post_id: { [Op.ne]: 5 },
        },
      });
    });

    it("should throw error for invalid slug input", async () => {
      await expect(ensureUniquePostSlug("")).rejects.toThrow(
        "Invalid slug provided for uniqueness check: it must be a non-empty string.",
      );
    });
  });

  describe("ensureUniqueCategorySlug", () => {
    it("should return the slug if it is unique", async () => {
      const mockFindOne = getMockedFindOne("categories");
      mockFindOne.mockResolvedValue(null);

      const result = await ensureUniqueCategorySlug("test-slug");

      expect(result).toBe("test-slug");
      expect(mockFindOne).toHaveBeenCalledWith({
        where: { slug: "test-slug" },
      });
    });

    it("should append count when slug exists", async () => {
      const mockFindOne = getMockedFindOne("categories");
      mockFindOne
        .mockResolvedValueOnce({ category_id: 1 } as never)
        .mockResolvedValueOnce(null);

      const result = await ensureUniqueCategorySlug("test-slug");

      expect(result).toBe("test-slug-1");
    });

    it("should exclude categoryId when checking uniqueness", async () => {
      const mockFindOne = getMockedFindOne("categories");
      mockFindOne.mockResolvedValue(null);

      await ensureUniqueCategorySlug("test-slug", 3);

      expect(mockFindOne).toHaveBeenCalledWith({
        where: {
          slug: "test-slug",
          category_id: { [Op.ne]: 3 },
        },
      });
    });

    it("should throw error for invalid slug input", async () => {
      await expect(ensureUniqueCategorySlug("")).rejects.toThrow(
        "Invalid slug provided for uniqueness check: it must be a non-empty string.",
      );
    });
  });

  describe("ensureUniqueTagSlug", () => {
    it("should return the slug if it is unique", async () => {
      const mockFindOne = getMockedFindOne("tags");
      mockFindOne.mockResolvedValue(null);

      const result = await ensureUniqueTagSlug("test-slug");

      expect(result).toBe("test-slug");
      expect(mockFindOne).toHaveBeenCalledWith({
        where: { slug: "test-slug" },
      });
    });

    it("should append count when slug exists", async () => {
      const mockFindOne = getMockedFindOne("tags");
      mockFindOne
        .mockResolvedValueOnce({ tag_id: 1 } as never)
        .mockResolvedValueOnce(null);

      const result = await ensureUniqueTagSlug("test-slug");

      expect(result).toBe("test-slug-1");
    });

    it("should exclude tagId when checking uniqueness", async () => {
      const mockFindOne = getMockedFindOne("tags");
      mockFindOne.mockResolvedValue(null);

      await ensureUniqueTagSlug("test-slug", 7);

      expect(mockFindOne).toHaveBeenCalledWith({
        where: {
          slug: "test-slug",
          tag_id: { [Op.ne]: 7 },
        },
      });
    });

    it("should throw error for invalid slug input", async () => {
      await expect(ensureUniqueTagSlug("")).rejects.toThrow(
        "Invalid slug provided for uniqueness check: it must be a non-empty string.",
      );
    });
  });

  describe("validateSlugFormat", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        body: {},
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      mockNext = vi.fn();
    });

    it("should call next when slug is valid", () => {
      mockReq.body = { slug: "valid-slug-123" };

      validateSlugFormat(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should call next when slug is not provided", () => {
      mockReq.body = {};

      validateSlugFormat(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should reject slug with uppercase letters", () => {
      mockReq.body = { slug: "Invalid-Slug" };

      validateSlugFormat(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "fail",
        message:
          "Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.",
        statusCode: 400,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject slug starting with hyphen", () => {
      mockReq.body = { slug: "-invalid-slug" };

      validateSlugFormat(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject slug ending with hyphen", () => {
      mockReq.body = { slug: "invalid-slug-" };

      validateSlugFormat(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject slug with special characters", () => {
      mockReq.body = { slug: "invalid@slug" };

      validateSlugFormat(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next for empty string (falsy value)", () => {
      mockReq.body = { slug: "" };

      validateSlugFormat(mockReq as Request, mockRes as Response, mockNext);

      // Empty string is falsy, so validation is skipped and next is called
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should reject slug longer than 100 characters", () => {
      mockReq.body = { slug: "a".repeat(101) };

      validateSlugFormat(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "fail",
        message: "Slug must be between 1 and 100 characters long.",
        statusCode: 400,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should accept slug with exactly 100 characters", () => {
      mockReq.body = { slug: "a".repeat(100) };

      validateSlugFormat(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("generateCategorySlugIfNeeded", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      vi.clearAllMocks();
      mockReq = {
        body: {},
        params: {},
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      mockNext = vi.fn();
    });

    it("should generate slug from name when slug is not provided", async () => {
      const mockFindOne = getMockedFindOne("categories");
      mockFindOne.mockResolvedValue(null);

      mockReq.body = { name: "Test Category" };

      await generateCategorySlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockReq.body.slug).toBe("test-category");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should use provided slug when available", async () => {
      const mockFindOne = getMockedFindOne("categories");
      mockFindOne.mockResolvedValue(null);

      mockReq.body = { name: "Test Category", slug: "custom-slug" };

      await generateCategorySlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockReq.body.slug).toBe("custom-slug");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should ensure slug uniqueness", async () => {
      const mockFindOne = getMockedFindOne("categories");
      mockFindOne
        .mockResolvedValueOnce({ category_id: 1 } as never)
        .mockResolvedValueOnce(null);

      mockReq.body = { name: "Test Category" };

      await generateCategorySlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockReq.body.slug).toBe("test-category-1");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should exclude category_id when provided", async () => {
      const mockFindOne = getMockedFindOne("categories");
      mockFindOne.mockResolvedValue(null);

      mockReq.body = { name: "Test Category" };
      mockReq.params = { category_id: "5" };

      await generateCategorySlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next when neither name nor slug is provided", async () => {
      mockReq.body = {};

      await generateCategorySlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.slug).toBeUndefined();
    });

    it("should handle errors and return 500", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      try {
        const mockFindOne = getMockedFindOne("categories");
        mockFindOne.mockRejectedValue(new Error("Database error"));

        mockReq.body = { name: "Test Category" };

        await generateCategorySlugIfNeeded(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: "error",
          message:
            "Internal server error while generating category slug if needed",
          statusCode: 500,
        });
        expect(mockNext).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe("generateTagSlugIfNeeded", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      vi.clearAllMocks();
      mockReq = {
        body: {},
        params: {},
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      mockNext = vi.fn();
    });

    it("should generate slug from name when slug is not provided", async () => {
      const mockFindOne = getMockedFindOne("tags");
      mockFindOne.mockResolvedValue(null);

      mockReq.body = { name: "Test Tag" };

      await generateTagSlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockReq.body.slug).toBe("test-tag");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should use provided slug when available", async () => {
      const mockFindOne = getMockedFindOne("tags");
      mockFindOne.mockResolvedValue(null);

      mockReq.body = { name: "Test Tag", slug: "custom-slug" };

      await generateTagSlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockReq.body.slug).toBe("custom-slug");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should ensure slug uniqueness", async () => {
      const mockFindOne = getMockedFindOne("tags");
      mockFindOne
        .mockResolvedValueOnce({ tag_id: 1 } as never)
        .mockResolvedValueOnce(null);

      mockReq.body = { name: "Test Tag" };

      await generateTagSlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockReq.body.slug).toBe("test-tag-1");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should exclude tag_id when provided", async () => {
      const mockFindOne = getMockedFindOne("tags");
      mockFindOne.mockResolvedValue(null);

      mockReq.body = { name: "Test Tag" };
      mockReq.params = { tag_id: "3" };

      await generateTagSlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next when neither name nor slug is provided", async () => {
      mockReq.body = {};

      await generateTagSlugIfNeeded(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.slug).toBeUndefined();
    });

    it("should handle errors and return 500", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      try {
        const mockFindOne = getMockedFindOne("tags");
        mockFindOne.mockRejectedValue(new Error("Database error"));

        mockReq.body = { name: "Test Tag" };

        await generateTagSlugIfNeeded(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: "error",
          message: "Internal server error while generating tag slug if needed",
          statusCode: 500,
        });
        expect(mockNext).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
