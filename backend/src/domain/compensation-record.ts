import type { RecordCompensationChangeInput } from "@acme/shared";

import type { ParsedCompensationSpreadsheetRow } from "./compensation-import.types.js";
import type { NewCompensationHistoryRecord } from "../repositories/interfaces/compensation.repository.js";

export function toNewCompensationHistoryRecord(
  employeeId: string,
  input: RecordCompensationChangeInput,
): NewCompensationHistoryRecord {
  return {
    employeeId,
    baseSalary: input.baseSalary,
    currency: input.currency,
    effectiveDate: input.effectiveDate,
    reason: input.reason,
    changedBy: input.changedBy,
    notes: input.notes ?? null,
  };
}

export function spreadsheetRowToNewCompensationHistoryRecord(
  row: ParsedCompensationSpreadsheetRow,
): NewCompensationHistoryRecord {
  return {
    employeeId: row.employeeId,
    baseSalary: row.baseSalary,
    currency: row.currency,
    effectiveDate: row.effectiveDate,
    reason: row.reason,
    changedBy: row.changedBy,
    notes: row.notes,
  };
}
