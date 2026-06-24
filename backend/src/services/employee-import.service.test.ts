import { describe, expect, it, vi } from "vitest";

import { buildEmployeeSpreadsheetBuffer } from "../domain/parse-employee-spreadsheet.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";
import { EmployeeImportService } from "./employee-import.service.js";

function createMockRepository(): IEmployeeRepository {
  return {
    findPaginated: vi.fn(),
    findDistinctEmployeeFilterValues: vi.fn(),
    upsertManyEmployees: vi.fn().mockResolvedValue({ inserted: 2, updated: 0, total: 2 }),
  };
}

describe("EmployeeImportService.previewEmployeeSpreadsheet", () => {
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

    expect(service.previewEmployeeSpreadsheet(buffer).isValid).toBe(true);
  });
});

describe("EmployeeImportService.importEmployeeSpreadsheet", () => {
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

    await expect(service.importEmployeeSpreadsheet(buffer)).resolves.toEqual({
      inserted: 2,
      updated: 0,
      total: 2,
    });
    expect(repository.upsertManyEmployees).toHaveBeenCalledOnce();
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

    await expect(service.importEmployeeSpreadsheet(buffer)).rejects.toMatchObject({
      name: "EmployeeImportValidationError",
    });
    expect(repository.upsertManyEmployees).not.toHaveBeenCalled();
  });
});
