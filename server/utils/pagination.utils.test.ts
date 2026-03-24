import { describe, it, expect } from "vitest";
import type { Request } from "express";
import {
  getPaginationOptions,
  buildPaginatedResponse,
  type PaginationOptions,
} from "./pagination.utils.js";

describe("pagination.utils", () => {
  describe("getPaginationOptions", () => {
    it("should return default values when query params are missing", () => {
      const req = {
        query: {},
      } as Request;

      const result = getPaginationOptions(req);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        offset: 0,
      });
    });

    it("should parse valid page and limit from query params", () => {
      const req = {
        query: {
          page: "2",
          limit: "20",
        },
      } as unknown as Request;

      const result = getPaginationOptions(req);

      expect(result).toEqual({
        page: 2,
        limit: 20,
        offset: 20,
      });
    });

    it("should default to page 1 when page is NaN", () => {
      const req = {
        query: {
          page: "invalid",
          limit: "10",
        },
      } as unknown as Request;

      const result = getPaginationOptions(req);

      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    it("should default to limit 10 when limit is NaN", () => {
      const req = {
        query: {
          page: "1",
          limit: "invalid",
        },
      } as unknown as Request;

      const result = getPaginationOptions(req);

      expect(result.limit).toBe(10);
    });

    it("should enforce minimum page of 1", () => {
      const req = {
        query: {
          page: "0",
          limit: "10",
        },
      } as unknown as Request;

      const result = getPaginationOptions(req);

      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    it("should enforce minimum page of 1 for negative values", () => {
      const req = {
        query: {
          page: "-5",
          limit: "10",
        },
      } as unknown as Request;

      const result = getPaginationOptions(req);

      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    it("should enforce minimum limit of 1", () => {
      const req = {
        query: {
          page: "1",
          limit: "0",
        },
      } as unknown as Request;

      const result = getPaginationOptions(req);

      expect(result.limit).toBe(1);
    });

    it("should enforce maximum limit of 50", () => {
      const req = {
        query: {
          page: "1",
          limit: "100",
        },
      } as unknown as Request;

      const result = getPaginationOptions(req);

      expect(result.limit).toBe(50);
    });

    it("should calculate offset correctly", () => {
      const req = {
        query: {
          page: "5",
          limit: "15",
        },
      } as unknown as Request;

      const result = getPaginationOptions(req);

      expect(result.offset).toBe(60); // (5 - 1) * 15
    });

    it("should handle string numbers in query params", () => {
      const req = {
        query: {
          page: "3",
          limit: "25",
        },
      } as unknown as Request;

      const result = getPaginationOptions(req);

      expect(result).toEqual({
        page: 3,
        limit: 25,
        offset: 50,
      });
    });
  });

  describe("buildPaginatedResponse", () => {
    const mockData = [
      { id: 1, title: "Post 1" },
      { id: 2, title: "Post 2" },
    ];

    it("should build paginated response with correct metadata", () => {
      const paginationOptions: PaginationOptions = {
        page: 1,
        limit: 10,
        offset: 0,
      };
      const totalCount = 25;

      const result = buildPaginatedResponse(
        mockData,
        totalCount,
        paginationOptions,
      );

      expect(result.data.posts).toEqual(mockData);
      expect(result.data.pagination).toEqual({
        currentPage: 1,
        totalPages: 3,
        totalCount: 25,
        limit: 10,
        hasNextPage: true,
        hasPrevPage: false,
        nextPage: 2,
        prevPage: null,
      });
    });

    it("should indicate no next page on last page", () => {
      const paginationOptions: PaginationOptions = {
        page: 3,
        limit: 10,
        offset: 20,
      };
      const totalCount = 25;

      const result = buildPaginatedResponse(
        mockData,
        totalCount,
        paginationOptions,
      );

      expect(result.data.pagination.hasNextPage).toBe(false);
      expect(result.data.pagination.nextPage).toBe(null);
      expect(result.data.pagination.hasPrevPage).toBe(true);
      expect(result.data.pagination.prevPage).toBe(2);
    });

    it("should handle single page results", () => {
      const paginationOptions: PaginationOptions = {
        page: 1,
        limit: 10,
        offset: 0,
      };
      const totalCount = 5;

      const result = buildPaginatedResponse(
        mockData,
        totalCount,
        paginationOptions,
      );

      expect(result.data.pagination.totalPages).toBe(1);
      expect(result.data.pagination.hasNextPage).toBe(false);
      expect(result.data.pagination.hasPrevPage).toBe(false);
      expect(result.data.pagination.nextPage).toBe(null);
      expect(result.data.pagination.prevPage).toBe(null);
    });

    it("should handle empty results", () => {
      const paginationOptions: PaginationOptions = {
        page: 1,
        limit: 10,
        offset: 0,
      };
      const totalCount = 0;

      const result = buildPaginatedResponse([], totalCount, paginationOptions);

      expect(result.data.posts).toEqual([]);
      expect(result.data.pagination.totalPages).toBe(1);
      expect(result.data.pagination.totalCount).toBe(0);
    });

    it("should ensure minimum totalPages of 1 even with zero count", () => {
      const paginationOptions: PaginationOptions = {
        page: 1,
        limit: 10,
        offset: 0,
      };
      const totalCount = 0;

      const result = buildPaginatedResponse([], totalCount, paginationOptions);

      expect(result.data.pagination.totalPages).toBe(1);
    });

    it("should calculate totalPages correctly with remainder", () => {
      const paginationOptions: PaginationOptions = {
        page: 1,
        limit: 10,
        offset: 0,
      };
      const totalCount = 23; // Should result in 3 pages

      const result = buildPaginatedResponse(
        mockData,
        totalCount,
        paginationOptions,
      );

      expect(result.data.pagination.totalPages).toBe(3);
    });

    it("should handle middle page correctly", () => {
      const paginationOptions: PaginationOptions = {
        page: 2,
        limit: 10,
        offset: 10,
      };
      const totalCount = 30;

      const result = buildPaginatedResponse(
        mockData,
        totalCount,
        paginationOptions,
      );

      expect(result.data.pagination.currentPage).toBe(2);
      expect(result.data.pagination.hasNextPage).toBe(true);
      expect(result.data.pagination.hasPrevPage).toBe(true);
      expect(result.data.pagination.nextPage).toBe(3);
      expect(result.data.pagination.prevPage).toBe(1);
    });
  });
});
