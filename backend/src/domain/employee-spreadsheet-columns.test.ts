import { describe, expect, it } from "vitest";

import {
  isSpreadsheetRowEmpty,
  normalizeSpreadsheetHeader,
  readSpreadsheetCell,
  resolveSpreadsheetColumnIndex,
} from "./employee-spreadsheet-columns.js";

describe("normalizeSpreadsheetHeader", () => {
  it("lowercases and trims header labels", () => {
    expect(normalizeSpreadsheetHeader("  Full Name ")).toBe("full name");
  });
});

describe("resolveSpreadsheetColumnIndex", () => {
  it("maps supported header aliases to column indexes", () => {
    expect(
      resolveSpreadsheetColumnIndex([
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
    expect(resolveSpreadsheetColumnIndex(["Employee ID", "Full Name"])).toBeNull();
  });
});

describe("isSpreadsheetRowEmpty", () => {
  it("returns true for blank rows", () => {
    expect(isSpreadsheetRowEmpty(["", null, undefined])).toBe(true);
  });
});

describe("readSpreadsheetCell", () => {
  it("returns an empty string for missing cell values", () => {
    expect(readSpreadsheetCell([], 0)).toBe("");
    expect(readSpreadsheetCell([null], 0)).toBe("");
    expect(readSpreadsheetCell([undefined], 0)).toBe("");
  });

  it("trims string cell values", () => {
    expect(readSpreadsheetCell(["  Jane Doe  "], 0)).toBe("Jane Doe");
  });
});
