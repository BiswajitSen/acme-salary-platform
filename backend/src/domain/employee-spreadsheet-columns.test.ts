import { describe, expect, it } from "vitest";

import {
  isEmployeeSpreadsheetRowEmpty,
  normalizeEmployeeSpreadsheetHeader,
  readEmployeeSpreadsheetCell,
  resolveEmployeeSpreadsheetColumnIndex,
} from "./employee-spreadsheet-columns.js";

describe("normalizeEmployeeSpreadsheetHeader", () => {
  it("lowercases and trims header labels", () => {
    expect(normalizeEmployeeSpreadsheetHeader("  Full Name ")).toBe("full name");
  });
});

describe("resolveEmployeeSpreadsheetColumnIndex", () => {
  it("maps supported header aliases to column indexes", () => {
    expect(
      resolveEmployeeSpreadsheetColumnIndex([
        "Employee ID",
        "Full Name",
        "Department",
        "Job Title",
        "Country",
      ]),
    ).toEqual({
      id: 0,
      fullName: 1,
      department: 2,
      jobTitle: 3,
      country: 4,
    });
  });

  it("returns null when a required column is missing", () => {
    expect(resolveEmployeeSpreadsheetColumnIndex(["Employee ID", "Full Name"])).toBeNull();
  });
});

describe("isEmployeeSpreadsheetRowEmpty", () => {
  it("returns true for blank rows", () => {
    expect(isEmployeeSpreadsheetRowEmpty(["", null, undefined])).toBe(true);
  });
});

describe("readEmployeeSpreadsheetCell", () => {
  it("returns an empty string for missing cell values", () => {
    expect(readEmployeeSpreadsheetCell([], 0)).toBe("");
    expect(readEmployeeSpreadsheetCell([null], 0)).toBe("");
    expect(readEmployeeSpreadsheetCell([undefined], 0)).toBe("");
  });

  it("trims string cell values", () => {
    expect(readEmployeeSpreadsheetCell(["  Jane Doe  "], 0)).toBe("Jane Doe");
  });
});
