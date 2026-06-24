import {
  DEFAULT_EMPLOYEE_PAGE,
  MAX_EMPLOYEE_LIMIT,
  type ListEmployeesQuery,
} from "@acme/shared";

export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export function normalizePagination(query: ListEmployeesQuery): PaginationParams {
  const page = Math.max(DEFAULT_EMPLOYEE_PAGE, query.page);
  const limit = Math.min(MAX_EMPLOYEE_LIMIT, Math.max(1, query.limit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
