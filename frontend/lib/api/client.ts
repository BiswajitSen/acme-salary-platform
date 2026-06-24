import type { ApiError } from "@acme/shared";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: ApiError,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return (
    error instanceof ApiRequestError ||
    (error instanceof Error &&
      error.name === "ApiRequestError" &&
      "status" in error &&
      typeof error.status === "number")
  );
}

type RequestOptions = {
  cache?: RequestCache;
};

export async function apiFetch<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
    },
  });

  return parseJsonResponse<T>(response);
}

export async function apiPostJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<T>(response);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let parsedBody: ApiError | undefined;

    try {
      parsedBody = (await response.json()) as ApiError;
    } catch {
      parsedBody = undefined;
    }

    throw new ApiRequestError(
      parsedBody?.message ?? `Request failed with status ${response.status}`,
      response.status,
      parsedBody,
    );
  }

  return response.json() as Promise<T>;
}
