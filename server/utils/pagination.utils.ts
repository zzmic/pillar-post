import { type Request } from "express";

export interface PaginationOptions {
  limit: number;
  offset: number;
  page: number;
}

interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface PaginatedResponse<T> {
  data: {
    posts: T;
    pagination: PaginationMetadata;
  };
}

export const getPaginationOptions = (req: Request): PaginationOptions => {
  const rawPage = Number.parseInt(String(req.query.page ?? ""), 10);
  const rawLimit = Number.parseInt(String(req.query.limit ?? ""), 10);

  const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
  const limitCandidate = Number.isNaN(rawLimit) ? 10 : rawLimit;
  const limit = Math.min(50, Math.max(1, limitCandidate));
  const offset = (page - 1) * limit;

  return {
    limit,
    offset,
    page,
  };
};

export const buildPaginatedResponse = <T>(
  data: T,
  totalCount: number,
  paginationOptions: PaginationOptions,
): PaginatedResponse<T> => {
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / paginationOptions.limit),
  );
  const hasNextPage = paginationOptions.page < totalPages;
  const hasPrevPage = paginationOptions.page > 1;

  return {
    data: {
      posts: data,
      pagination: {
        currentPage: paginationOptions.page,
        totalPages,
        totalCount,
        limit: paginationOptions.limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? paginationOptions.page + 1 : null,
        prevPage: hasPrevPage ? paginationOptions.page - 1 : null,
      },
    },
  };
};
