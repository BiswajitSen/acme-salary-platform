import { isApiRequestError } from "@/lib/api/client";

export function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (isApiRequestError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
