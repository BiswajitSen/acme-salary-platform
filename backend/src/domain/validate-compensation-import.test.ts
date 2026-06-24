import { describe, expect, it, vi } from "vitest";

import type { ParsedCompensationSpreadsheetRow } from "./compensation-import.types.js";
import { collectUnknownEmployeeIdErrors } from "./validate-compensation-import.js";

describe("collectUnknownEmployeeIdErrors", () => {
  it("returns errors for employee ids that do not exist", async () => {
    const employees = {
      findExistingEmployeeIds: vi.fn().mockResolvedValue(new Set(["E001"])),
    };

    const records: ParsedCompensationSpreadsheetRow[] = [
      {
        rowNumber: 2,
        employeeId: "E001",
        baseSalary: 120_000,
        currency: "USD",
        effectiveDate: "2024-01-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: null,
      },
      {
        rowNumber: 3,
        employeeId: "E404",
        baseSalary: 95_000,
        currency: "USD",
        effectiveDate: "2024-06-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: null,
      },
    ];

    await expect(collectUnknownEmployeeIdErrors(employees, records)).resolves.toEqual([
      {
        rowNumber: 3,
        field: "employeeId",
        message: 'Employee "E404" does not exist',
      },
    ]);
    expect(employees.findExistingEmployeeIds).toHaveBeenCalledWith(["E001", "E404"]);
  });

  it("looks up each unique employee id once", async () => {
    const employees = {
      findExistingEmployeeIds: vi.fn().mockResolvedValue(new Set<string>()),
    };

    const records: ParsedCompensationSpreadsheetRow[] = [
      {
        rowNumber: 2,
        employeeId: "E404",
        baseSalary: 95_000,
        currency: "USD",
        effectiveDate: "2024-06-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: null,
      },
      {
        rowNumber: 3,
        employeeId: "E404",
        baseSalary: 96_000,
        currency: "USD",
        effectiveDate: "2024-07-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: null,
      },
    ];

    await expect(collectUnknownEmployeeIdErrors(employees, records)).resolves.toEqual([
      {
        rowNumber: 2,
        field: "employeeId",
        message: 'Employee "E404" does not exist',
      },
      {
        rowNumber: 3,
        field: "employeeId",
        message: 'Employee "E404" does not exist',
      },
    ]);
    expect(employees.findExistingEmployeeIds).toHaveBeenCalledWith(["E404"]);
  });
});
