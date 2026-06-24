import { describe, expect, it } from "vitest";

import { compensationSpreadsheetRowSchema } from "./compensation-import.types.js";

describe("compensationSpreadsheetRowSchema", () => {
  it("normalizes undefined notes to null", () => {
    expect(
      compensationSpreadsheetRowSchema.parse({
        employeeId: "E001",
        baseSalary: 120_000,
        currency: "USD",
        effectiveDate: "2024-01-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: undefined,
      }).notes,
    ).toBeNull();
  });

  it("trims non-empty notes", () => {
    expect(
      compensationSpreadsheetRowSchema.parse({
        employeeId: "E001",
        baseSalary: 120_000,
        currency: "USD",
        effectiveDate: "2024-01-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: "  Signed offer  ",
      }).notes,
    ).toBe("Signed offer");
  });

  it("rejects invalid compensation reasons", () => {
    const result = compensationSpreadsheetRowSchema.safeParse({
      employeeId: "E001",
      baseSalary: 120_000,
      currency: "USD",
      effectiveDate: "2024-01-01",
      reason: "Invalid Reason",
      changedBy: "HR Admin",
      notes: null,
    });

    expect(result.success).toBe(false);
  });
});
