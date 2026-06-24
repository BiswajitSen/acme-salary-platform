import { z } from "zod";

export const employeeSpreadsheetRowSchema = z.object({
  id: z.string().trim().min(1, "Employee ID is required"),
  fullName: z.string().trim().min(1, "Full name is required"),
  department: z.string().trim().min(1, "Department is required"),
  jobTitle: z.string().trim().min(1, "Job title is required"),
  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(3, "Country must be an ISO code"),
});

export type EmployeeSpreadsheetRow = z.infer<typeof employeeSpreadsheetRowSchema>;

export type EmployeeImportError = {
  rowNumber: number;
  field: string;
  message: string;
};

export type EmployeeImportPreview = {
  employees: EmployeeSpreadsheetRow[];
  errors: EmployeeImportError[];
  isValid: boolean;
};

export type EmployeeImportResult = {
  inserted: number;
  updated: number;
  total: number;
};
