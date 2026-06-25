import type {
  CompensationImportPreviewResponse,
  CompensationImportResultResponse,
} from "@acme/shared";

import {
  readSpreadsheetValidationIssues,
  uploadSpreadsheetFile,
} from "./spreadsheet-upload";

const IMPORT_PREVIEW_URL = "/api/backend/import/compensation/preview";
const IMPORT_CONFIRM_URL = "/api/backend/import/compensation/confirm";

export async function previewCompensationImport(
  file: File,
): Promise<CompensationImportPreviewResponse> {
  return uploadSpreadsheetFile<CompensationImportPreviewResponse>(
    IMPORT_PREVIEW_URL,
    file,
  );
}

export async function confirmCompensationImport(
  file: File,
): Promise<CompensationImportResultResponse> {
  return uploadSpreadsheetFile<CompensationImportResultResponse>(
    IMPORT_CONFIRM_URL,
    file,
  );
}

export const readCompensationImportValidationIssues = readSpreadsheetValidationIssues;
