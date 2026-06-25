import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api/client";

import { getApiLoadErrorMessage } from "./errors";

describe("getApiLoadErrorMessage", () => {
  it("formats API errors with status label and resource label", () => {
    expect(
      getApiLoadErrorMessage(
        new ApiRequestError("relation employees does not exist", 500),
        "employee data",
      ),
    ).toBe("500 Internal Server Error — Failed to load employee data.");
  });

  it("handles network failures separately from API errors", () => {
    expect(getApiLoadErrorMessage(new TypeError("Failed to fetch"), "employee data")).toBe(
      "Failed to load employee data. Is the backend running?",
    );
  });

  it("includes generic error messages when present", () => {
    expect(getApiLoadErrorMessage(new Error("Network error"), "employee data")).toBe(
      "Failed to load employee data. Network error",
    );
  });
});
