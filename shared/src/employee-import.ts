import type { EmployeeSummary } from "./employees";

export type EmployeeImportValidationIssue = {
  rowNumber: number;
  field: string;
  message: string;
};

export type EmployeeImportPreviewResponse = {
  employees: EmployeeSummary[];
  errors: EmployeeImportValidationIssue[];
  isValid: boolean;
};

export type EmployeeImportResultResponse = {
  inserted: number;
  updated: number;
  total: number;
};

export type EmployeeImportValidationErrorResponse = {
  error: string;
  message: string;
  errors: EmployeeImportValidationIssue[];
};
