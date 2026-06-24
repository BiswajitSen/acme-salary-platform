import { describe, expect, it } from "vitest";

import {
  isCompensationSpreadsheetRowEmpty,
  normalizeCompensationSpreadsheetHeader,
  readCompensationSpreadsheetCell,
  resolveCompensationSpreadsheetColumnIndex,
} from "./compensation-spreadsheet-columns.js";

describe("normalizeCompensationSpreadsheetHeader", () => {
  it("normalizes header labels", () => {
    expect(normalizeCompensationSpreadsheetHeader("  Base   Salary ")).toBe(
      "base salary",
    );
  });
});

describe("resolveCompensationSpreadsheetColumnIndex", () => {
  it("resolves required compensation columns", () => {
    expect(
      resolveCompensationSpreadsheetColumnIndex([
        "employee_id",
        "base_salary",
        "currency",
        "effective_date",
        "reason",
        "changed_by",
        "notes",
      ]),
    ).toEqual({
      employeeId: 0,
      baseSalary: 1,
      currency: 2,
      effectiveDate: 3,
      reason: 4,
      changedBy: 5,
      notes: 6,
    });
  });

  it("returns null when a required column is missing", () => {
    expect(resolveCompensationSpreadsheetColumnIndex(["employee_id"])).toBeNull();
  });
});

describe("readCompensationSpreadsheetCell", () => {
  it("returns an empty string for missing cells", () => {
    expect(readCompensationSpreadsheetCell([], 0)).toBe("");
    expect(readCompensationSpreadsheetCell([null], 0)).toBe("");
  });
});

describe("isCompensationSpreadsheetRowEmpty", () => {
  it("treats blank rows as empty", () => {
    expect(isCompensationSpreadsheetRowEmpty(["", null, undefined])).toBe(true);
  });
});
