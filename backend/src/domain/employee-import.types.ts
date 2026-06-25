import { createEmployeeSchema, type CreateEmployeeInput } from "@acme/shared";

export const employeeSpreadsheetRowSchema = createEmployeeSchema;

export type EmployeeSpreadsheetRow = CreateEmployeeInput;

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
