import type {
  CompensationImportPreviewResponse,
  CompensationImportResultResponse,
  CompensationImportValidationErrorResponse,
} from "@acme/shared";

import { ApiRequestError } from "./client";

const IMPORT_PREVIEW_URL = "/api/backend/import/compensation/preview";
const IMPORT_CONFIRM_URL = "/api/backend/import/compensation/confirm";

async function uploadCompensationSpreadsheet<T>(
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
    let body: CompensationImportValidationErrorResponse | undefined;

    try {
      body = (await response.json()) as CompensationImportValidationErrorResponse;
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

export async function previewCompensationImport(
  file: File,
): Promise<CompensationImportPreviewResponse> {
  return uploadCompensationSpreadsheet<CompensationImportPreviewResponse>(
    IMPORT_PREVIEW_URL,
    file,
  );
}

export async function confirmCompensationImport(
  file: File,
): Promise<CompensationImportResultResponse> {
  return uploadCompensationSpreadsheet<CompensationImportResultResponse>(
    IMPORT_CONFIRM_URL,
    file,
  );
}

export function readCompensationImportValidationIssues(
  error: unknown,
): CompensationImportValidationErrorResponse["errors"] {
  if (!(error instanceof ApiRequestError)) {
    return [];
  }

  const body = error.body as CompensationImportValidationErrorResponse | undefined;
  return body?.errors ?? [];
}
