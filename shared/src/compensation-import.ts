import type { CompensationReason } from "./compensation.js";

export type CompensationImportValidationIssue = {
  rowNumber: number;
  field: string;
  message: string;
};

export type CompensationImportRecord = {
  employeeId: string;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: CompensationReason;
  changedBy: string;
  notes: string | null;
};

export type CompensationImportPreviewResponse = {
  recordCount: number;
  errors: CompensationImportValidationIssue[];
  isValid: boolean;
};

export type CompensationImportResultResponse = {
  inserted: number;
  total: number;
};

export type CompensationImportValidationErrorResponse = {
  error: string;
  message: string;
  errors: CompensationImportValidationIssue[];
};
