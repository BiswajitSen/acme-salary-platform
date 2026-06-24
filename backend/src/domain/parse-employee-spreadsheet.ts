import * as XLSX from "xlsx";

import type {
  EmployeeImportError,
  EmployeeImportPreview,
  EmployeeSpreadsheetRow,
} from "./employee-import.types.js";
import { employeeSpreadsheetRowSchema } from "./employee-import.types.js";
import {
  isEmployeeSpreadsheetRowEmpty,
  readEmployeeSpreadsheetCell,
  resolveEmployeeSpreadsheetColumnIndex,
  type EmployeeSpreadsheetColumnIndex,
} from "./employee-spreadsheet-columns.js";
import { collectDuplicateEmployeeIdErrors } from "./validate-employee-import.js";

function parseEmployeeSpreadsheetRow(
  row: unknown[],
  rowNumber: number,
  columnIndex: EmployeeSpreadsheetColumnIndex,
): { employee?: EmployeeSpreadsheetRow; errors: EmployeeImportError[] } {
  if (isEmployeeSpreadsheetRowEmpty(row)) {
    return { errors: [] };
  }

  const candidate = {
    id: readEmployeeSpreadsheetCell(row, columnIndex.id),
    fullName: readEmployeeSpreadsheetCell(row, columnIndex.fullName),
    department: readEmployeeSpreadsheetCell(row, columnIndex.department),
    jobTitle: readEmployeeSpreadsheetCell(row, columnIndex.jobTitle),
    country: readEmployeeSpreadsheetCell(row, columnIndex.country),
  };

  const parsed = employeeSpreadsheetRowSchema.safeParse(candidate);

  if (parsed.success) {
    return { employee: parsed.data, errors: [] };
  }

  return {
    errors: parsed.error.errors.map((issue) => ({
      rowNumber,
      field: String(issue.path[0] ?? "row"),
      message: issue.message,
    })),
  };
}

export function parseEmployeeSpreadsheetWorkbook(
  workbook: XLSX.WorkBook,
): EmployeeImportPreview {
  const [firstSheetName] = workbook.SheetNames;

  if (!firstSheetName) {
    return {
      employees: [],
      errors: [
        {
          rowNumber: 0,
          field: "sheet",
          message: "Spreadsheet does not contain any worksheets",
        },
      ],
      isValid: false,
    };
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName]!, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (rows.length === 0) {
    return {
      employees: [],
      errors: [
        {
          rowNumber: 0,
          field: "sheet",
          message: "Spreadsheet is empty",
        },
      ],
      isValid: false,
    };
  }

  const [headerRow, ...dataRows] = rows;
  const columnIndex = resolveEmployeeSpreadsheetColumnIndex(
    (headerRow ?? []).map((value) => String(value)),
  );

  if (!columnIndex) {
    return {
      employees: [],
      errors: [
        {
          rowNumber: 1,
          field: "header",
          message:
            "Expected columns: employee id, full name, department, job title, country",
        },
      ],
      isValid: false,
    };
  }

  const employees: EmployeeSpreadsheetRow[] = [];
  const errors: EmployeeImportError[] = [];

  for (const [index, row] of dataRows.entries()) {
    const rowNumber = index + 2;
    const result = parseEmployeeSpreadsheetRow(
      Array.isArray(row) ? row : [],
      rowNumber,
      columnIndex,
    );

    if (result.employee) {
      employees.push(result.employee);
    }

    errors.push(...result.errors);
  }

  errors.push(...collectDuplicateEmployeeIdErrors(employees));

  return {
    employees,
    errors,
    isValid: errors.length === 0 && employees.length > 0,
  };
}

export function parseEmployeeSpreadsheet(
  spreadsheetBuffer: Buffer,
): EmployeeImportPreview {
  const workbook = XLSX.read(spreadsheetBuffer, { type: "buffer" });
  return parseEmployeeSpreadsheetWorkbook(workbook);
}

export function buildEmployeeSpreadsheetBuffer(
  rows: Array<Record<string, string>>,
): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
