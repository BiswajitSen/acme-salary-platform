import { describe, expect, it, vi } from "vitest";

import { buildCompensationSpreadsheetBuffer } from "../domain/parse-compensation-spreadsheet.js";
import { CompensationImportValidationError } from "../lib/compensation-import-validation-error.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";
import { CompensationImportService } from "./compensation-import.service.js";

function createService(
  employees: Partial<IEmployeeRepository>,
  compensation: Partial<ICompensationRepository>,
) {
  return new CompensationImportService(
    employees as IEmployeeRepository,
    compensation as ICompensationRepository,
  );
}

describe("CompensationImportService", () => {
  it("returns a preview for a valid spreadsheet", async () => {
    const service = createService(
      {
        findExistingEmployeeIds: vi.fn().mockResolvedValue(new Set(["E001"])),
      },
      {},
    );

    const buffer = buildCompensationSpreadsheetBuffer([
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

    await expect(service.previewCompensationSpreadsheet(buffer)).resolves.toEqual({
      recordCount: 1,
      errors: [],
      isValid: true,
    });
  });

  it("includes unknown employee errors in the preview", async () => {
    const service = createService(
      {
        findExistingEmployeeIds: vi.fn().mockResolvedValue(new Set()),
      },
      {},
    );

    const buffer = buildCompensationSpreadsheetBuffer([
      {
        employee_id: "E404",
        base_salary: 120000,
        currency: "USD",
        effective_date: "2024-01-01",
        reason: "New Hire",
        changed_by: "HR Admin",
        notes: "",
      },
    ]);

    const preview = await service.previewCompensationSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors).toEqual([
      {
        rowNumber: 2,
        field: "employeeId",
        message: 'Employee "E404" does not exist',
      },
    ]);
  });

  it("imports valid compensation rows in an all-or-nothing transaction", async () => {
    const insertManyCompensationHistoryRecords = vi.fn().mockResolvedValue({
      inserted: 1,
      total: 1,
    });
    const service = createService(
      {
        findExistingEmployeeIds: vi.fn().mockResolvedValue(new Set(["E001"])),
      },
      { insertManyCompensationHistoryRecords },
    );

    const buffer = buildCompensationSpreadsheetBuffer([
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

    await expect(service.importCompensationSpreadsheet(buffer)).resolves.toEqual({
      inserted: 1,
      total: 1,
    });
  });

  it("rejects invalid spreadsheets during confirm", async () => {
    const service = createService(
      {
        findExistingEmployeeIds: vi.fn().mockResolvedValue(new Set()),
      },
      {},
    );

    const buffer = buildCompensationSpreadsheetBuffer([
      {
        employee_id: "E404",
        base_salary: 120000,
        currency: "USD",
        effective_date: "2024-01-01",
        reason: "New Hire",
        changed_by: "HR Admin",
        notes: "",
      },
    ]);

    await expect(service.importCompensationSpreadsheet(buffer)).rejects.toBeInstanceOf(
      CompensationImportValidationError,
    );
  });
});
