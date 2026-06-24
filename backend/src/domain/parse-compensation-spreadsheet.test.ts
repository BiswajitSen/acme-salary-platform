import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";

import {
  buildCompensationSpreadsheetBuffer,
  parseCompensationSpreadsheet,
  parseCompensationSpreadsheetWorkbook,
} from "./parse-compensation-spreadsheet.js";
import { compensationSpreadsheetRowSchema } from "./compensation-import.types.js";

describe("parseCompensationSpreadsheet", () => {
  it("parses valid compensation rows from an xlsx buffer", () => {
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

    expect(parseCompensationSpreadsheet(buffer)).toEqual({
      records: [
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
      ],
      errors: [],
      isValid: true,
    });
  });

  it("preserves non-empty notes", () => {
    const buffer = buildCompensationSpreadsheetBuffer([
      {
        employee_id: "E001",
        base_salary: 120000,
        currency: "USD",
        effective_date: "2024-01-01",
        reason: "New Hire",
        changed_by: "HR Admin",
        notes: "Signed offer",
      },
    ]);

    expect(parseCompensationSpreadsheet(buffer).records[0]?.notes).toBe("Signed offer");
  });

  it("skips blank rows in the spreadsheet", () => {
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

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
    XLSX.utils.sheet_add_aoa(sheet, [["", "", "", "", "", "", ""]], { origin: "A3" });

    const preview = parseCompensationSpreadsheetWorkbook(workbook);

    expect(preview.records).toHaveLength(1);
    expect(preview.isValid).toBe(true);
  });

  it("rejects rows with missing required values", () => {
    const buffer = buildCompensationSpreadsheetBuffer([
      {
        employee_id: "",
        base_salary: 120000,
        currency: "USD",
        effective_date: "2024-01-01",
        reason: "New Hire",
        changed_by: "HR Admin",
        notes: "",
      },
    ]);

    const preview = parseCompensationSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rowNumber: 2,
          field: "employeeId",
        }),
      ]),
    );
  });

  it("handles non-array workbook rows as empty rows", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["employee_id"]]),
      "Compensation",
    );

    vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValue([
      [
        "employee_id",
        "base_salary",
        "currency",
        "effective_date",
        "reason",
        "changed_by",
        "notes",
      ],
      "invalid-row",
    ]);

    const preview = parseCompensationSpreadsheetWorkbook(workbook);

    expect(preview.records).toEqual([]);
    expect(preview.isValid).toBe(false);

    vi.restoreAllMocks();
  });

  it("handles workbooks with a missing header row", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["employee_id"]]),
      "Compensation",
    );

    vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValue([undefined]);

    const preview = parseCompensationSpreadsheetWorkbook(workbook);

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.field).toBe("header");

    vi.restoreAllMocks();
  });

  it("maps row-level schema failures without field paths to the row field", () => {
    vi.spyOn(compensationSpreadsheetRowSchema, "safeParse").mockReturnValue({
      success: false,
      error: {
        errors: [{ path: [], message: "Invalid row" }],
      },
    } as never);

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

    const preview = parseCompensationSpreadsheet(buffer);

    expect(preview.errors).toEqual([
      { rowNumber: 2, field: "row", message: "Invalid row" },
    ]);

    vi.restoreAllMocks();
  });

  it("reports validation issues with field names", () => {
    const buffer = buildCompensationSpreadsheetBuffer([
      {
        employee_id: "E001",
        base_salary: 120000,
        currency: "US",
        effective_date: "2024-01-01",
        reason: "New Hire",
        changed_by: "HR Admin",
        notes: "",
      },
    ]);

    const preview = parseCompensationSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.field).toBe("currency");
  });

  it("rejects spreadsheets that only contain a header row", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        [
          "employee_id",
          "base_salary",
          "currency",
          "effective_date",
          "reason",
          "changed_by",
          "notes",
        ],
      ]),
      "Compensation",
    );

    const preview = parseCompensationSpreadsheetWorkbook(workbook);

    expect(preview.records).toEqual([]);
    expect(preview.errors).toEqual([]);
    expect(preview.isValid).toBe(false);
  });

  it("rejects spreadsheets without required headers", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([["employee_id", "base_salary"]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Compensation");

    const preview = parseCompensationSpreadsheetWorkbook(workbook);

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.field).toBe("header");
  });

  it("rejects empty spreadsheets", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), "Compensation");

    const preview = parseCompensationSpreadsheetWorkbook(workbook);

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.message).toBe("Spreadsheet is empty");
  });

  it("rejects workbooks without worksheets", () => {
    const preview = parseCompensationSpreadsheetWorkbook(XLSX.utils.book_new());

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.message).toBe(
      "Spreadsheet does not contain any worksheets",
    );
  });
});
