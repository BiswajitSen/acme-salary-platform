import type {
  EmployeeImportPreviewResponse,
  EmployeeImportResultResponse,
} from "@acme/shared";

import {
  readSpreadsheetValidationIssues,
  uploadSpreadsheetFile,
} from "./spreadsheet-upload";

const IMPORT_PREVIEW_URL = "/api/backend/import/preview";
const IMPORT_CONFIRM_URL = "/api/backend/import/confirm";

export async function previewEmployeeImport(
  file: File,
): Promise<EmployeeImportPreviewResponse> {
  return uploadSpreadsheetFile<EmployeeImportPreviewResponse>(IMPORT_PREVIEW_URL, file);
}

export async function confirmEmployeeImport(
  file: File,
): Promise<EmployeeImportResultResponse> {
  return uploadSpreadsheetFile<EmployeeImportResultResponse>(IMPORT_CONFIRM_URL, file);
}

export const readEmployeeImportValidationIssues = readSpreadsheetValidationIssues;
