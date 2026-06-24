import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { logger } from "../config/logger.js";
import { isAppError } from "../lib/errors.js";
import { CompensationImportValidationError } from "../lib/compensation-import-validation-error.js";
import { EmployeeImportValidationError } from "../lib/employee-import-validation-error.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist",
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation Error",
      message: error.errors.map((issue) => issue.message).join(", "),
    });
    return;
  }

  if (error instanceof EmployeeImportValidationError) {
    res.status(400).json({
      error: error.name,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  if (error instanceof CompensationImportValidationError) {
    res.status(400).json({
      error: error.name,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  if (isAppError(error)) {
    res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
    });
    return;
  }

  logger.error({ err: error }, "Unhandled error");

  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred",
  });
}
