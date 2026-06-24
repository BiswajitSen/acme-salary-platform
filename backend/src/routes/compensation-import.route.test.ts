import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../lib/errors.js";
import { CompensationImportValidationError } from "../lib/compensation-import-validation-error.js";
import { errorHandler } from "../middleware/error-handler.js";
import { buildCompensationSpreadsheetBuffer } from "../domain/parse-compensation-spreadsheet.js";
import type { CompensationImportService } from "../services/compensation-import.service.js";
import { createCompensationImportRouter } from "./compensation-import.route.js";

function createValidSpreadsheetBuffer() {
  return buildCompensationSpreadsheetBuffer([
    {
      employee_id: "E001",
      base_salary: 120000,
      currency: "USD",
      effective_date: "2024-01-01",
      reason: "New Hire",
      changed_by: "HR Admin",
      notes: "",
    },
  ]);
}

function createTestApp(compensationImportService: CompensationImportService) {
  const app = express();
  app.use(
    "/import/compensation",
    createCompensationImportRouter({ compensationImportService }),
  );
  app.use(errorHandler);
  return app;
}

describe("createCompensationImportRouter", () => {
  it("returns a preview for a valid spreadsheet upload", async () => {
    const compensationImportService = {
      previewCompensationSpreadsheet: vi.fn().mockResolvedValue({
        recordCount: 1,
        errors: [],
        isValid: true,
      }),
      importCompensationSpreadsheet: vi.fn(),
    } as unknown as CompensationImportService;

    const response = await request(createTestApp(compensationImportService))
      .post("/import/compensation/preview")
      .attach("file", createValidSpreadsheetBuffer(), "compensation.xlsx");

    expect(response.status).toBe(200);
    expect(response.body.isValid).toBe(true);
    expect(
      compensationImportService.previewCompensationSpreadsheet,
    ).toHaveBeenCalledOnce();
  });

  it("imports compensation records when confirm receives a valid spreadsheet", async () => {
    const compensationImportService = {
      previewCompensationSpreadsheet: vi.fn(),
      importCompensationSpreadsheet: vi.fn().mockResolvedValue({
        inserted: 1,
        total: 1,
      }),
    } as unknown as CompensationImportService;

    const response = await request(createTestApp(compensationImportService))
      .post("/import/compensation/confirm")
      .attach("file", createValidSpreadsheetBuffer(), "compensation.xlsx");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ inserted: 1, total: 1 });
  });

  it("rejects requests without a spreadsheet file", async () => {
    const compensationImportService = {
      previewCompensationSpreadsheet: vi.fn(),
      importCompensationSpreadsheet: vi.fn(),
    } as unknown as CompensationImportService;

    const response = await request(createTestApp(compensationImportService)).post(
      "/import/compensation/preview",
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Spreadsheet file is required");
  });

  it("maps import validation failures to 400 with row errors", async () => {
    const compensationImportService = {
      previewCompensationSpreadsheet: vi.fn(),
      importCompensationSpreadsheet: vi.fn().mockRejectedValue(
        new CompensationImportValidationError(
          "Compensation spreadsheet validation failed",
          [{ rowNumber: 2, field: "employeeId", message: "Employee ID is required" }],
        ),
      ),
    } as unknown as CompensationImportService;

    const response = await request(createTestApp(compensationImportService))
      .post("/import/compensation/confirm")
      .attach("file", createValidSpreadsheetBuffer(), "compensation.xlsx");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { rowNumber: 2, field: "employeeId", message: "Employee ID is required" },
    ]);
  });

  it("forwards unexpected service errors to the error handler", async () => {
    const compensationImportService = {
      previewCompensationSpreadsheet: vi.fn().mockRejectedValue(
        new AppError(500, "Parser unavailable"),
      ),
      importCompensationSpreadsheet: vi.fn(),
    } as unknown as CompensationImportService;

    const response = await request(createTestApp(compensationImportService))
      .post("/import/compensation/preview")
      .attach("file", createValidSpreadsheetBuffer(), "compensation.xlsx");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Parser unavailable");
  });
});
