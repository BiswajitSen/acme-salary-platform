import { describe, expect, it } from "vitest";

import { ApiRequestError, apiFetch } from "./client";

describe("apiFetch", () => {
  it("returns parsed json for successful responses", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    await expect(apiFetch<{ status: string }>("/api/backend/health")).resolves.toEqual({
      status: "ok",
    });

    global.fetch = originalFetch;
  });

  it("throws ApiRequestError with parsed error body", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(JSON.stringify({ error: "Validation Error", message: "Invalid limit" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    await expect(apiFetch("/api/backend/employees")).rejects.toEqual(
      expect.objectContaining<Partial<ApiRequestError>>({
        message: "Invalid limit",
        status: 400,
      }),
    );

    global.fetch = originalFetch;
  });

  it("throws ApiRequestError when error body is not json", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response("Bad Gateway", { status: 502 });

    await expect(apiFetch("/api/backend/employees")).rejects.toEqual(
      expect.objectContaining<Partial<ApiRequestError>>({
        message: "Request failed with status 502",
        status: 502,
      }),
    );

    global.fetch = originalFetch;
  });
});

describe("ApiRequestError", () => {
  it("stores status and response body", () => {
    const error = new ApiRequestError("Failed", 500, {
      error: "Internal Server Error",
      message: "Failed",
    });

    expect(error.name).toBe("ApiRequestError");
    expect(error.status).toBe(500);
    expect(error.body?.error).toBe("Internal Server Error");
  });
});
