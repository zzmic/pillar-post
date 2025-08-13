// Utility function to get pagination options from request query parameters.
const getPaginationOptions = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return {
    limit,
    offset,
    page,
  };
};

// Utility function to build a paginated response.
const buildPaginatedResponse = (data, totalCount, paginationOptions) => {
  const totalPages = Math.ceil(totalCount / paginationOptions.limit);
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

export { getPaginationOptions, buildPaginatedResponse };
