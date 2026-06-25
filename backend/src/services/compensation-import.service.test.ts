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
      {
        findEmployeeIdsWithCompensationHistory: vi.fn().mockResolvedValue(new Set()),
        findCompensationHistoryByEmployeeId: vi.fn().mockResolvedValue([]),
      },
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
      {
        findEmployeeIdsWithCompensationHistory: vi.fn().mockResolvedValue(new Set()),
        findCompensationHistoryByEmployeeId: vi.fn().mockResolvedValue([]),
      },
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
      { insertManyCompensationHistoryRecords, findEmployeeIdsWithCompensationHistory: vi.fn().mockResolvedValue(new Set()), findCompensationHistoryByEmployeeId: vi.fn().mockResolvedValue([]) },
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
      {
        findEmployeeIdsWithCompensationHistory: vi.fn().mockResolvedValue(new Set()),
        findCompensationHistoryByEmployeeId: vi.fn().mockResolvedValue([]),
      },
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

  it("rejects duplicate New Hire rows for the same employee in one import", async () => {
    const service = createService(
      {
        findExistingEmployeeIds: vi.fn().mockResolvedValue(new Set(["E001"])),
      },
      {
        findEmployeeIdsWithCompensationHistory: vi.fn().mockResolvedValue(new Set()),
        findCompensationHistoryByEmployeeId: vi.fn().mockResolvedValue([]),
      },
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
      {
        employee_id: "E001",
        base_salary: 130000,
        currency: "USD",
        effective_date: "2025-01-01",
        reason: "New Hire",
        changed_by: "HR Admin",
        notes: "",
      },
    ]);

    const preview = await service.previewCompensationSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors).toEqual([
      {
        rowNumber: 3,
        field: "reason",
        message: 'Employee "E001" already has a New Hire row in this import (row 2)',
      },
    ]);
  });

  it("rejects New Hire rows when the employee already has compensation history", async () => {
    const service = createService(
      {
        findExistingEmployeeIds: vi.fn().mockResolvedValue(new Set(["E001"])),
      },
      {
        findEmployeeIdsWithCompensationHistory: vi.fn().mockResolvedValue(new Set(["E001"])),
        findCompensationHistoryByEmployeeId: vi.fn().mockResolvedValue([]),
      },
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

    const preview = await service.previewCompensationSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]).toEqual({
      rowNumber: 2,
      field: "reason",
      message: 'Employee "E001" already has compensation history; use a different reason',
    });
  });

  it("rejects salary increase reason rows below the previous salary in preview", async () => {
    const service = createService(
      {
        findExistingEmployeeIds: vi.fn().mockResolvedValue(new Set(["E001"])),
      },
      {
        findEmployeeIdsWithCompensationHistory: vi.fn().mockResolvedValue(new Set()),
        findCompensationHistoryByEmployeeId: vi.fn().mockResolvedValue([
          {
            id: 1,
            employeeId: "E001",
            baseSalary: 120_000,
            currency: "USD",
            effectiveDate: "2024-01-01",
            reason: "New Hire",
            changedBy: "HR Admin",
            notes: null,
            createdAt: "2024-01-02T10:00:00.000Z",
          },
        ]),
      },
    );

    const buffer = buildCompensationSpreadsheetBuffer([
      {
        employee_id: "E001",
        base_salary: 110000,
        currency: "USD",
        effective_date: "2025-01-01",
        reason: "Annual Increment",
        changed_by: "HR Admin",
        notes: "",
      },
    ]);

    const preview = await service.previewCompensationSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]).toEqual({
      rowNumber: 2,
      field: "baseSalary",
      message:
        "Annual Increment salary cannot be less than the previous salary of 120000 USD",
    });
  });
});
