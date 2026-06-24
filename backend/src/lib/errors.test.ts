import { describe, expect, it } from "vitest";

import { AppError, isAppError } from "./errors.js";

describe("AppError", () => {
  it("stores status code and message", () => {
    const error = new AppError(404, "Employee not found");

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Employee not found");
    expect(error.name).toBe("AppError");
  });
});

describe("isAppError", () => {
  it("returns true for AppError instances", () => {
    expect(isAppError(new AppError(400, "Bad request"))).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isAppError(new Error("Generic"))).toBe(false);
    expect(isAppError("not an error")).toBe(false);
  });
});
