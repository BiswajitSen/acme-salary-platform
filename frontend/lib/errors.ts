import { isApiRequestError } from "@/lib/api/client";

const HTTP_STATUS_LABELS: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

function getHttpStatusLabel(status: number): string {
  return HTTP_STATUS_LABELS[status] ?? "Request Failed";
}

export function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (isApiRequestError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function getApiLoadErrorMessage(error: unknown, resourceLabel: string): string {
  if (isApiRequestError(error)) {
    return `${error.status} ${getHttpStatusLabel(error.status)} — Failed to load ${resourceLabel}.`;
  }

  if (error instanceof TypeError) {
    return `Failed to load ${resourceLabel}. Is the backend running?`;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return `Failed to load ${resourceLabel}. ${error.message}`;
  }

  return `Failed to load ${resourceLabel}.`;
}
