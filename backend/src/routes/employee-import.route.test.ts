import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../lib/errors.js";
import { EmployeeImportValidationError } from "../lib/employee-import-validation-error.js";
import { errorHandler } from "../middleware/error-handler.js";
import { buildEmployeeSpreadsheetBuffer } from "../domain/parse-employee-spreadsheet.js";
import type { EmployeeImportService } from "../services/employee-import.service.js";
import { createEmployeeImportRouter } from "./employee-import.route.js";

function createValidSpreadsheetBuffer() {
  return buildEmployeeSpreadsheetBuffer([
    {
      employee_id: "E001",
      full_name: "Jane Doe",
      department: "Engineering",
      job_title: "Senior Engineer",
      country: "US",
    },
  ]);
}

function createTestApp(employeeImportService: EmployeeImportService) {
  const app = express();
  app.use("/import", createEmployeeImportRouter({ employeeImportService }));
  app.use(errorHandler);
  return app;
}

describe("createEmployeeImportRouter", () => {
  it("returns a preview for a valid spreadsheet upload", async () => {
    const employeeImportService = {
      previewEmployeeSpreadsheet: vi.fn().mockReturnValue({
        employees: [
          {
            id: "E001",
            fullName: "Jane Doe",
            department: "Engineering",
            jobTitle: "Senior Engineer",
            country: "US",
          },
        ],
        errors: [],
        isValid: true,
      }),
      importEmployeeSpreadsheet: vi.fn(),
    } as unknown as EmployeeImportService;

    const response = await request(createTestApp(employeeImportService))
      .post("/import/preview")
      .attach("file", createValidSpreadsheetBuffer(), "employees.xlsx");

    expect(response.status).toBe(200);
    expect(response.body.isValid).toBe(true);
    expect(employeeImportService.previewEmployeeSpreadsheet).toHaveBeenCalledOnce();
  });

  it("imports employees when confirm receives a valid spreadsheet", async () => {
    const employeeImportService = {
      previewEmployeeSpreadsheet: vi.fn(),
      importEmployeeSpreadsheet: vi.fn().mockResolvedValue({
        inserted: 1,
        updated: 0,
        total: 1,
      }),
    } as unknown as EmployeeImportService;

    const response = await request(createTestApp(employeeImportService))
      .post("/import/confirm")
      .attach("file", createValidSpreadsheetBuffer(), "employees.xlsx");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ inserted: 1, updated: 0, total: 1 });
  });

  it("rejects requests without a spreadsheet file", async () => {
    const employeeImportService = {
      previewEmployeeSpreadsheet: vi.fn(),
      importEmployeeSpreadsheet: vi.fn(),
    } as unknown as EmployeeImportService;

    const response = await request(createTestApp(employeeImportService)).post(
      "/import/preview",
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Spreadsheet file is required");
  });

  it("rejects non-xlsx uploads", async () => {
    const employeeImportService = {
      previewEmployeeSpreadsheet: vi.fn(),
      importEmployeeSpreadsheet: vi.fn(),
    } as unknown as EmployeeImportService;

    const response = await request(createTestApp(employeeImportService))
      .post("/import/preview")
      .attach("file", Buffer.from("not-a-spreadsheet"), "employees.csv");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Only .xlsx spreadsheets are supported");
  });

  it("maps import validation failures to 400 with row errors", async () => {
    const employeeImportService = {
      previewEmployeeSpreadsheet: vi.fn(),
      importEmployeeSpreadsheet: vi.fn().mockRejectedValue(
        new EmployeeImportValidationError("Employee spreadsheet validation failed", [
          { rowNumber: 2, field: "id", message: "Employee ID is required" },
        ]),
      ),
    } as unknown as EmployeeImportService;

    const response = await request(createTestApp(employeeImportService))
      .post("/import/confirm")
      .attach("file", createValidSpreadsheetBuffer(), "employees.xlsx");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { rowNumber: 2, field: "id", message: "Employee ID is required" },
    ]);
  });

  it("forwards unexpected service errors to the error handler", async () => {
    const employeeImportService = {
      previewEmployeeSpreadsheet: vi.fn().mockImplementation(() => {
        throw new AppError(500, "Parser unavailable");
      }),
      importEmployeeSpreadsheet: vi.fn(),
    } as unknown as EmployeeImportService;

    const response = await request(createTestApp(employeeImportService))
      .post("/import/preview")
      .attach("file", createValidSpreadsheetBuffer(), "employees.xlsx");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Parser unavailable");
  });
});
