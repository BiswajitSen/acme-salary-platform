import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";

import { employeeSpreadsheetRowSchema } from "./employee-import.types.js";
import {
  buildEmployeeSpreadsheetBuffer,
  parseEmployeeSpreadsheet,
  parseEmployeeSpreadsheetWorkbook,
} from "./parse-employee-spreadsheet.js";
import { collectDuplicateEmployeeIdErrors } from "./validate-employee-import.js";

describe("parseEmployeeSpreadsheet", () => {
  it("parses valid employee rows from an xlsx buffer", () => {
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

    expect(parseEmployeeSpreadsheet(buffer)).toEqual({
      employees: [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
        {
          id: "E002",
          fullName: "Bob Smith",
          department: "HR",
          jobTitle: "HR Manager",
          country: "UK",
        },
      ],
      errors: [],
      isValid: true,
    });
  });

  it("rejects rows with missing required values", () => {
    const buffer = buildEmployeeSpreadsheetBuffer([
      {
        employee_id: "",
        full_name: "Jane Doe",
        department: "Engineering",
        job_title: "Senior Engineer",
        country: "US",
      },
    ]);

    const preview = parseEmployeeSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rowNumber: 2,
          field: "id",
        }),
      ]),
    );
  });

  it("rejects duplicate employee ids", () => {
    const buffer = buildEmployeeSpreadsheetBuffer([
      {
        employee_id: "E001",
        full_name: "Jane Doe",
        department: "Engineering",
        job_title: "Senior Engineer",
        country: "US",
      },
      {
        employee_id: "E001",
        full_name: "Duplicate Jane",
        department: "Engineering",
        job_title: "Senior Engineer",
        country: "US",
      },
    ]);

    const preview = parseEmployeeSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.message).toContain("Duplicate employee ID");
  });

  it("skips blank rows in the worksheet", () => {
    const preview = parseEmployeeSpreadsheetWorkbook({
      SheetNames: ["Employees"],
      Sheets: {
        Employees: XLSX.utils.aoa_to_sheet([
          ["employee_id", "full_name", "department", "job_title", "country"],
          ["E001", "Jane Doe", "Engineering", "Senior Engineer", "US"],
          ["", "", "", "", ""],
          ["E002", "Bob Smith", "HR", "HR Manager", "UK"],
        ]),
      },
    });

    expect(preview.employees).toHaveLength(2);
    expect(preview.isValid).toBe(true);
  });

  it("rejects spreadsheets without worksheets", () => {
    const preview = parseEmployeeSpreadsheetWorkbook({
      SheetNames: [],
      Sheets: {},
    });

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.field).toBe("sheet");
  });

  it("rejects empty spreadsheets", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), "Employees");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const preview = parseEmployeeSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.message).toBe("Spreadsheet is empty");
  });

  it("rejects spreadsheets with missing required headers", () => {
    const buffer = buildEmployeeSpreadsheetBuffer([
      {
        employee_id: "E001",
        full_name: "Jane Doe",
      },
    ] as Array<Record<string, string>>);

    const preview = parseEmployeeSpreadsheet(buffer);

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.field).toBe("header");
  });

  it("rejects spreadsheets with headers but no employee rows", () => {
    const preview = parseEmployeeSpreadsheetWorkbook({
      SheetNames: ["Employees"],
      Sheets: {
        Employees: XLSX.utils.aoa_to_sheet([
          ["employee_id", "full_name", "department", "job_title", "country"],
        ]),
      },
    });

    expect(preview.isValid).toBe(false);
    expect(preview.employees).toHaveLength(0);
  });

  it("handles spreadsheets with a missing header row", () => {
    vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValueOnce([undefined] as unknown[]);

    const preview = parseEmployeeSpreadsheetWorkbook({
      SheetNames: ["Employees"],
      Sheets: { Employees: {} },
    });

    expect(preview.isValid).toBe(false);
    expect(preview.errors[0]?.field).toBe("header");

    vi.restoreAllMocks();
  });

  it("handles malformed worksheet rows", () => {
    vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValueOnce([
      ["employee_id", "full_name", "department", "job_title", "country"],
      "not-an-array",
    ] as unknown[]);

    const preview = parseEmployeeSpreadsheetWorkbook({
      SheetNames: ["Employees"],
      Sheets: { Employees: {} },
    });

    expect(preview.employees).toHaveLength(0);
    expect(preview.isValid).toBe(false);

    vi.restoreAllMocks();
  });

  it("maps validation issues without field paths to the row field", () => {
    vi.spyOn(employeeSpreadsheetRowSchema, "safeParse").mockReturnValueOnce({
      success: false,
      error: {
        errors: [{ path: [], message: "Invalid row" }],
      },
    } as ReturnType<typeof employeeSpreadsheetRowSchema.safeParse>);

    vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValueOnce([
      ["employee_id", "full_name", "department", "job_title", "country"],
      ["E001", "Jane Doe", "Engineering", "Senior Engineer", "US"],
    ] as unknown[]);

    const preview = parseEmployeeSpreadsheetWorkbook({
      SheetNames: ["Employees"],
      Sheets: { Employees: {} },
    });

    expect(preview.errors[0]).toEqual({
      rowNumber: 2,
      field: "row",
      message: "Invalid row",
    });

    vi.restoreAllMocks();
  });
});

describe("collectDuplicateEmployeeIdErrors", () => {
  it("returns an error for repeated employee ids", () => {
    expect(
      collectDuplicateEmployeeIdErrors([
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
        {
          id: "E001",
          fullName: "Duplicate",
          department: "HR",
          jobTitle: "Manager",
          country: "UK",
        },
      ]),
    ).toHaveLength(1);
  });
});
