import { z } from "zod";

export const DEFAULT_EMPLOYEE_PAGE = 1;
export const DEFAULT_EMPLOYEE_LIMIT = 50;
export const MAX_EMPLOYEE_LIMIT = 100;

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_EMPLOYEE_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_EMPLOYEE_LIMIT)
    .default(DEFAULT_EMPLOYEE_LIMIT),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

export type EmployeeSummary = {
  id: string;
  fullName: string;
  department: string;
  jobTitle: string;
  country: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedEmployeesResponse = {
  data: EmployeeSummary[];
  meta: PaginationMeta;
};
