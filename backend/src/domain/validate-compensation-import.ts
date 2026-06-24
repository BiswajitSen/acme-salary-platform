import type { ParsedCompensationSpreadsheetRow } from "./compensation-import.types.js";
import type { CompensationImportError } from "./compensation-import.types.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";

export async function collectUnknownEmployeeIdErrors(
  employees: IEmployeeRepository,
  records: ParsedCompensationSpreadsheetRow[],
): Promise<CompensationImportError[]> {
  const uniqueEmployeeIds = [
    ...new Set(records.map((record) => record.employeeId)),
  ] satisfies string[];

  const existingEmployeeIds = await employees.findExistingEmployeeIds(uniqueEmployeeIds);

  return records
    .filter((record) => !existingEmployeeIds.has(record.employeeId))
    .map((record) => ({
      rowNumber: record.rowNumber,
      field: "employeeId",
      message: `Employee "${record.employeeId}" does not exist`,
    }));
}
