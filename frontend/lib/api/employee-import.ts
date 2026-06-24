import type {
  EmployeeImportPreviewResponse,
  EmployeeImportResultResponse,
  EmployeeImportValidationErrorResponse,
} from "@acme/shared";

import { ApiRequestError } from "./client";

const IMPORT_PREVIEW_URL = "/api/backend/import/preview";
const IMPORT_CONFIRM_URL = "/api/backend/import/confirm";

async function uploadEmployeeSpreadsheet<T>(
  url: string,
  file: File,
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let body: EmployeeImportValidationErrorResponse | undefined;

    try {
      body = (await response.json()) as EmployeeImportValidationErrorResponse;
    } catch {
      body = undefined;
    }

    throw new ApiRequestError(
      body?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body,
    );
  }

  return response.json() as Promise<T>;
}

export async function previewEmployeeImport(
  file: File,
): Promise<EmployeeImportPreviewResponse> {
  return uploadEmployeeSpreadsheet<EmployeeImportPreviewResponse>(
    IMPORT_PREVIEW_URL,
    file,
  );
}

export async function confirmEmployeeImport(
  file: File,
): Promise<EmployeeImportResultResponse> {
  return uploadEmployeeSpreadsheet<EmployeeImportResultResponse>(
    IMPORT_CONFIRM_URL,
    file,
  );
}

export function readEmployeeImportValidationIssues(
  error: unknown,
): EmployeeImportValidationErrorResponse["errors"] {
  if (!(error instanceof ApiRequestError)) {
    return [];
  }

  const body = error.body as EmployeeImportValidationErrorResponse | undefined;
  return body?.errors ?? [];
}
