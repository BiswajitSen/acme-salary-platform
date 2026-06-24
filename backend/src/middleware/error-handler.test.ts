import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";

import { AppError } from "../lib/errors.js";
import { EmployeeImportValidationError } from "../lib/employee-import-validation-error.js";
import { errorHandler, notFoundHandler } from "./error-handler.js";

function createMockResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return response as unknown as Response & {
    statusCode: number;
    body: unknown;
  };
}

describe("notFoundHandler", () => {
  it("returns a 404 payload", () => {
    const response = createMockResponse();

    notFoundHandler({} as Request, response);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: "Not Found",
      message: "The requested resource does not exist",
    });
  });
});

describe("errorHandler", () => {
  it("maps Zod validation errors to 400", () => {
    const response = createMockResponse();
    const schema = z.object({ page: z.number().int().positive() });
    let validationError: ZodError;

    try {
      schema.parse({ page: 0 });
    } catch (error) {
      validationError = error as ZodError;
    }

    errorHandler(validationError!, {} as Request, response, vi.fn() as NextFunction);

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ error: "Validation Error" });
  });

  it("maps AppError to its status code", () => {
    const response = createMockResponse();

    errorHandler(
      new AppError(404, "Employee not found"),
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: "AppError",
      message: "Employee not found",
    });
  });

  it("maps employee import validation errors to 400 with row details", () => {
    const response = createMockResponse();

    errorHandler(
      new EmployeeImportValidationError("Employee spreadsheet validation failed", [
        { rowNumber: 2, field: "id", message: "Employee ID is required" },
      ]),
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: "EmployeeImportValidationError",
      message: "Employee spreadsheet validation failed",
      errors: [{ rowNumber: 2, field: "id", message: "Employee ID is required" }],
    });
  });

  it("maps unknown errors to 500", () => {
    const response = createMockResponse();

    errorHandler(
      new Error("Unexpected"),
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    });
  });
});
