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

export const EMPLOYEE_JOB_TITLES = [
  "Analyst",
  "Coordinator",
  "Director",
  "Engineer",
  "Financial Analyst",
  "HR Manager",
  "Lead Coordinator",
  "Manager",
  "Senior Engineer",
  "Staff Engineer",
] as const;

export type EmployeeJobTitle = (typeof EMPLOYEE_JOB_TITLES)[number];

export const employeeCoreFieldsSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  department: z.string().trim().min(1, "Department is required"),
  jobTitle: z.string().trim().min(1, "Job title is required"),
  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(3, "Country must be an ISO code")
    .transform((value) => value.toUpperCase()),
});

export const createEmployeeSchema = employeeCoreFieldsSchema.extend({
  id: z.string().trim().min(1, "Employee ID is required"),
});

export const updateEmployeeSchema = employeeCoreFieldsSchema;

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
