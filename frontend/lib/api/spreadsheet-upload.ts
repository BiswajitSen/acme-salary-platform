import { ApiRequestError } from "./client";

export async function uploadSpreadsheetFile<T>(url: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let body: unknown;

    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `Request failed with status ${response.status}`;

    throw new ApiRequestError(message, response.status, body as ApiRequestError["body"]);
  }

  return response.json() as Promise<T>;
}

export function readSpreadsheetValidationIssues(
  error: unknown,
): Array<{ rowNumber: number; field: string; message: string }> {
  if (!(error instanceof ApiRequestError)) {
    return [];
  }

  const body = error.body;

  if (!body || typeof body !== "object" || !("errors" in body) || !Array.isArray(body.errors)) {
    return [];
  }

  return body.errors;
}
