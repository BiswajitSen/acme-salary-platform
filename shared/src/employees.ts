import { z } from "zod";

export const DEFAULT_EMPLOYEE_PAGE = 1;
export const DEFAULT_EMPLOYEE_LIMIT = 50;
export const MAX_EMPLOYEE_LIMIT = 100;

export const EMPLOYEE_EMPLOYMENT_STATUSES = ["ACTIVE", "NO_COMPENSATION"] as const;

export type EmployeeEmploymentStatus = (typeof EMPLOYEE_EMPLOYMENT_STATUSES)[number];

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_EMPLOYEE_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_EMPLOYEE_LIMIT)
    .default(DEFAULT_EMPLOYEE_LIMIT),
  search: z.string().trim().optional(),
  country: z.string().trim().optional(),
  department: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  employmentStatus: z.string().trim().optional(),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

export type EmployeeSummary = {
  id: string;
  fullName: string;
  department: string;
  jobTitle: string;
  country: string;
  baseSalary: number | null;
  currency: string | null;
  employmentStatus: EmployeeEmploymentStatus;
};

export type EmployeeDirectoryStats = {
  total: number;
  active: number;
  noCompensation: number;
  departments: number;
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
  stats: EmployeeDirectoryStats;
};

export type EmployeeFilterOptions = {
  countries: string[];
  departments: string[];
  jobTitles: string[];
};
