import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";

import { AppError } from "../lib/errors.js";
import { CompensationImportValidationError } from "../lib/compensation-import-validation-error.js";
import { EmployeeImportValidationError } from "../lib/employee-import-validation-error.js";
import { env } from "../config/env.js";
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

  it("maps compensation import validation errors to 400 with row details", () => {
    const response = createMockResponse();

    errorHandler(
      new CompensationImportValidationError(
        "Compensation spreadsheet validation failed",
        [{ rowNumber: 2, field: "employeeId", message: "Employee ID is required" }],
      ),
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: "CompensationImportValidationError",
      message: "Compensation spreadsheet validation failed",
      errors: [
        { rowNumber: 2, field: "employeeId", message: "Employee ID is required" },
      ],
    });
  });

  it("maps multer file size errors to 400", () => {
    const response = createMockResponse();

    errorHandler(
      new MulterError("LIMIT_FILE_SIZE"),
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: "Upload Error",
      message: "Spreadsheet exceeds the maximum upload size",
    });
  });

  it("maps other multer errors to 400 with the multer message", () => {
    const response = createMockResponse();
    const error = new MulterError("LIMIT_UNEXPECTED_FILE");
    error.message = "Unexpected field";

    errorHandler(error, {} as Request, response, vi.fn() as NextFunction);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: "Upload Error",
      message: "Unexpected field",
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

  it("returns the error message in development for unknown errors", () => {
    const response = createMockResponse();
    const originalNodeEnv = env.NODE_ENV;

    env.NODE_ENV = "development";

    try {
      errorHandler(
        new Error("Database connection refused"),
        {} as Request,
        response,
        vi.fn() as NextFunction,
      );
    } finally {
      env.NODE_ENV = originalNodeEnv;
    }

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: "Internal Server Error",
      message: "Database connection refused",
    });
  });

  it("maps non-error throwables to 500", () => {
    const response = createMockResponse();

    errorHandler("failure", {} as Request, response, vi.fn() as NextFunction);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    });
  });
});
