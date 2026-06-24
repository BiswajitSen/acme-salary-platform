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

  if (!response.ok) {
    let body: ApiError | undefined;

    try {
      body = (await response.json()) as ApiError;
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
