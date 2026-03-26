import type { Response } from "express";

export type ApiErrorPayload = {
  status: "fail" | "error";
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  data?: Record<string, unknown>;
};

export type SendApiErrorOptions = {
  errors?: Record<string, string[]>;
  data?: Record<string, unknown>;
};

export function sendApiError(
  res: Response,
  statusCode: number,
  message: string,
  options?: SendApiErrorOptions,
): void {
  const payload: ApiErrorPayload = {
    status: statusCode >= 500 ? "error" : "fail",
    message,
    statusCode,
  };
  if (options?.errors !== undefined && Object.keys(options.errors).length > 0) {
    payload.errors = options.errors;
  }
  if (options?.data !== undefined && Object.keys(options.data).length > 0) {
    payload.data = options.data;
  }
  res.status(statusCode).json(payload);
}
