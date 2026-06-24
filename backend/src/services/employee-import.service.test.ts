import { describe, expect, it, vi } from "vitest";

import { buildEmployeeSpreadsheetBuffer } from "../domain/parse-employee-spreadsheet.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";
import { EmployeeImportService } from "./employee-import.service.js";

function createMockRepository(): IEmployeeRepository {
  return {
    findPaginated: vi.fn(),
    findDistinctFilterValues: vi.fn(),
    upsertMany: vi.fn().mockResolvedValue({ inserted: 2, updated: 0, total: 2 }),
  };
}

describe("EmployeeImportService.previewSpreadsheet", () => {
  it("returns parsed employees for a valid spreadsheet", () => {
    const service = new EmployeeImportService(createMockRepository());
    const buffer = buildEmployeeSpreadsheetBuffer([
      {
        employee_id: "E001",
        full_name: "Jane Doe",
        department: "Engineering",
        job_title: "Senior Engineer",
        country: "US",
      },
    ]);

    expect(service.previewSpreadsheet(buffer).isValid).toBe(true);
  });
});

describe("EmployeeImportService.importSpreadsheet", () => {
  it("upserts employees when the spreadsheet is valid", async () => {
    const repository = createMockRepository();
    const service = new EmployeeImportService(repository);
    const buffer = buildEmployeeSpreadsheetBuffer([
      {
        employee_id: "E001",
        full_name: "Jane Doe",
        department: "Engineering",
        job_title: "Senior Engineer",
        country: "US",
      },
      {
        employee_id: "E002",
        full_name: "Bob Smith",
        department: "HR",
        job_title: "HR Manager",
        country: "UK",
      },
    ]);

    await expect(service.importSpreadsheet(buffer)).resolves.toEqual({
      inserted: 2,
      updated: 0,
      total: 2,
    });
    expect(repository.upsertMany).toHaveBeenCalledOnce();
  });

  it("rejects invalid spreadsheets before writing to the database", async () => {
    const repository = createMockRepository();
    const service = new EmployeeImportService(repository);
    const buffer = buildEmployeeSpreadsheetBuffer([
      {
        employee_id: "",
        full_name: "Jane Doe",
        department: "Engineering",
        job_title: "Senior Engineer",
        country: "US",
      },
    ]);

    await expect(service.importSpreadsheet(buffer)).rejects.toMatchObject({
      name: "EmployeeImportValidationError",
    });
    expect(repository.upsertMany).not.toHaveBeenCalled();
  });
});
