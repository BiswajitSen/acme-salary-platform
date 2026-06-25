import { describe, expect, it, vi } from "vitest";

import type { ParsedCompensationSpreadsheetRow } from "./compensation-import.types.js";
import {
  collectSalaryIncreaseReasonErrorsFromHistory,
  collectDuplicateNewHireInSpreadsheetErrors,
  collectNewHireWithExistingHistoryErrors,
  collectUnknownEmployeeIdErrors,
} from "./validate-compensation-import.js";

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

describe("collectDuplicateNewHireInSpreadsheetErrors", () => {
  it("flags later New Hire rows for the same employee in one import", () => {
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
        employeeId: "E001",
        baseSalary: 130_000,
        currency: "USD",
        effectiveDate: "2025-01-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: null,
      },
    ];

    expect(collectDuplicateNewHireInSpreadsheetErrors(records)).toEqual([
      {
        rowNumber: 3,
        field: "reason",
        message: 'Employee "E001" already has a New Hire row in this import (row 2)',
      },
    ]);
  });
});

describe("collectNewHireWithExistingHistoryErrors", () => {
  it("flags New Hire rows when the employee already has compensation history", async () => {
    const compensation = {
      findEmployeeIdsWithCompensationHistory: vi.fn().mockResolvedValue(new Set(["E001"])),
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
    ];

    await expect(
      collectNewHireWithExistingHistoryErrors(compensation, records),
    ).resolves.toEqual([
      {
        rowNumber: 2,
        field: "reason",
        message: 'Employee "E001" already has compensation history; use a different reason',
      },
    ]);
  });
});

describe("collectSalaryIncreaseReasonErrorsFromHistory", () => {
  it.each(["Annual Increment", "Promotion"] as const)(
    "flags %s rows below the previous salary",
    (reason) => {
    const existingHistoryByEmployee = new Map([
      [
        "E001",
        [
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
        ],
      ],
    ]);

    const records: ParsedCompensationSpreadsheetRow[] = [
      {
        rowNumber: 2,
        employeeId: "E001",
        baseSalary: 110_000,
        currency: "USD",
        effectiveDate: "2025-01-01",
        reason,
        changedBy: "HR Admin",
        notes: null,
      },
    ];

    expect(
      collectSalaryIncreaseReasonErrorsFromHistory(existingHistoryByEmployee, records),
    ).toEqual([
      {
        rowNumber: 2,
        field: "baseSalary",
        message: `${reason} salary cannot be less than the previous salary of 120000 USD`,
      },
    ]);
    },
  );
});
