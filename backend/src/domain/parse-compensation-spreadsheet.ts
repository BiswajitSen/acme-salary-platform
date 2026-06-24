import * as XLSX from "xlsx";

import type {
  CompensationImportError,
  CompensationImportPreview,
  ParsedCompensationSpreadsheetRow,
} from "./compensation-import.types.js";
import { compensationSpreadsheetRowSchema } from "./compensation-import.types.js";
import {
  isCompensationSpreadsheetRowEmpty,
  readCompensationSpreadsheetCell,
  resolveCompensationSpreadsheetColumnIndex,
  type CompensationSpreadsheetColumnIndex,
} from "./compensation-spreadsheet-columns.js";

function parseCompensationSpreadsheetRow(
  row: unknown[],
  rowNumber: number,
  columnIndex: CompensationSpreadsheetColumnIndex,
): { record?: ParsedCompensationSpreadsheetRow; errors: CompensationImportError[] } {
  if (isCompensationSpreadsheetRowEmpty(row)) {
    return { errors: [] };
  }

  const candidate = {
    employeeId: readCompensationSpreadsheetCell(row, columnIndex.employeeId),
    baseSalary: readCompensationSpreadsheetCell(row, columnIndex.baseSalary),
    currency: readCompensationSpreadsheetCell(row, columnIndex.currency),
    effectiveDate: readCompensationSpreadsheetCell(row, columnIndex.effectiveDate),
    reason: readCompensationSpreadsheetCell(row, columnIndex.reason),
    changedBy: readCompensationSpreadsheetCell(row, columnIndex.changedBy),
    notes: readCompensationSpreadsheetCell(row, columnIndex.notes),
  };

  const parsed = compensationSpreadsheetRowSchema.safeParse(candidate);

  if (parsed.success) {
    return {
      record: { ...parsed.data, rowNumber },
      errors: [],
    };
  }

  return {
    errors: parsed.error.errors.map((issue) => ({
      rowNumber,
      field: String(issue.path[0] ?? "row"),
      message: issue.message,
    })),
  };
}

export function parseCompensationSpreadsheetWorkbook(
  workbook: XLSX.WorkBook,
): CompensationImportPreview {
  const [firstSheetName] = workbook.SheetNames;

  if (!firstSheetName) {
    return {
      records: [],
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
      records: [],
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
  const columnIndex = resolveCompensationSpreadsheetColumnIndex(
    (headerRow ?? []).map((value) => String(value)),
  );

  if (!columnIndex) {
    return {
      records: [],
      errors: [
        {
          rowNumber: 1,
          field: "header",
          message:
            "Expected columns: employee id, base salary, currency, effective date, reason, changed by, notes",
        },
      ],
      isValid: false,
    };
  }

  const records: ParsedCompensationSpreadsheetRow[] = [];
  const errors: CompensationImportError[] = [];

  for (const [index, row] of dataRows.entries()) {
    const rowNumber = index + 2;
    const result = parseCompensationSpreadsheetRow(
      Array.isArray(row) ? row : [],
      rowNumber,
      columnIndex,
    );

    if (result.record) {
      records.push(result.record);
    }

    errors.push(...result.errors);
  }

  return {
    records,
    errors,
    isValid: errors.length === 0 && records.length > 0,
  };
}

export function parseCompensationSpreadsheet(
  spreadsheetBuffer: Buffer,
): CompensationImportPreview {
  const workbook = XLSX.read(spreadsheetBuffer, { type: "buffer" });
  return parseCompensationSpreadsheetWorkbook(workbook);
}

export function buildCompensationSpreadsheetBuffer(
  rows: Array<Record<string, string | number>>,
): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Compensation");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
