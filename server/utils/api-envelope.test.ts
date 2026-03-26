import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";

import { sendApiError } from "./api-envelope.js";

function createMockResponse(): {
  res: Response;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
} {
  const json = vi.fn();
  const status = vi.fn().mockImplementation(() => ({ json }));
  const res = { status, json } as unknown as Response;
  return { res, status, json };
}

describe("api-envelope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendApiError", () => {
    it("sets HTTP status and JSON body with status fail for 4xx", () => {
      const { res, status, json } = createMockResponse();

      sendApiError(res, 400, "Bad request");

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        status: "fail",
        message: "Bad request",
        statusCode: 400,
      });
    });

    it("uses status error for 5xx", () => {
      const { res, status, json } = createMockResponse();

      sendApiError(res, 500, "Internal problem");

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        status: "error",
        message: "Internal problem",
        statusCode: 500,
      });
    });

    it("treats 499 as client fail, not server error", () => {
      const { res, json } = createMockResponse();

      sendApiError(res, 499, "Client closed");

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fail",
          statusCode: 499,
        }),
      );
    });

    it("includes errors when options.errors is non-empty", () => {
      const { res, json } = createMockResponse();
      const errors = { email: ["Invalid"] };

      sendApiError(res, 422, "Validation errors", { errors });

      expect(json).toHaveBeenCalledWith({
        status: "fail",
        message: "Validation errors",
        statusCode: 422,
        errors,
      });
    });

    it("omits errors when options.errors is empty", () => {
      const { res, json } = createMockResponse();

      sendApiError(res, 422, "Validation errors", { errors: {} });

      expect(json).toHaveBeenCalledWith({
        status: "fail",
        message: "Validation errors",
        statusCode: 422,
      });
    });

    it("omits errors when options is omitted", () => {
      const { res, json } = createMockResponse();

      sendApiError(res, 404, "Not found");

      expect(json).toHaveBeenCalledWith({
        status: "fail",
        message: "Not found",
        statusCode: 404,
      });
    });

    it("includes data when options.data is non-empty", () => {
      const { res, json } = createMockResponse();
      const data = { associatedPosts: 3 };

      sendApiError(res, 409, "Conflict", { data });

      expect(json).toHaveBeenCalledWith({
        status: "fail",
        message: "Conflict",
        statusCode: 409,
        data,
      });
    });

    it("omits data when options.data is empty", () => {
      const { res, json } = createMockResponse();

      sendApiError(res, 409, "Conflict", { data: {} });

      expect(json).toHaveBeenCalledWith({
        status: "fail",
        message: "Conflict",
        statusCode: 409,
      });
    });

    it("includes both errors and data when both are non-empty", () => {
      const { res, json } = createMockResponse();

      sendApiError(res, 422, "Problems", {
        errors: { x: ["a"] },
        data: { hint: "fix" },
      });

      expect(json).toHaveBeenCalledWith({
        status: "fail",
        message: "Problems",
        statusCode: 422,
        errors: { x: ["a"] },
        data: { hint: "fix" },
      });
    });
  });
});
