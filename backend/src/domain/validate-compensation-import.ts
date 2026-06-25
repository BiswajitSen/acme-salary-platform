import type { ParsedCompensationSpreadsheetRow } from "./compensation-import.types.js";
import type { CompensationImportError } from "./compensation-import.types.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
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

export function collectDuplicateNewHireInSpreadsheetErrors(
  records: ParsedCompensationSpreadsheetRow[],
): CompensationImportError[] {
  const firstNewHireRowByEmployee = new Map<string, number>();

  return records.flatMap((record) => {
    if (record.reason !== "New Hire") {
      return [];
    }

    const firstRow = firstNewHireRowByEmployee.get(record.employeeId);

    if (firstRow === undefined) {
      firstNewHireRowByEmployee.set(record.employeeId, record.rowNumber);
      return [];
    }

    return [
      {
        rowNumber: record.rowNumber,
        field: "reason",
        message: `Employee "${record.employeeId}" already has a New Hire row in this import (row ${firstRow})`,
      },
    ];
  });
}

export async function collectNewHireWithExistingHistoryErrors(
  compensation: ICompensationRepository,
  records: ParsedCompensationSpreadsheetRow[],
): Promise<CompensationImportError[]> {
  const newHireEmployeeIds = [
    ...new Set(
      records
        .filter((record) => record.reason === "New Hire")
        .map((record) => record.employeeId),
    ),
  ];

  if (newHireEmployeeIds.length === 0) {
    return [];
  }

  const employeeIdsWithHistory =
    await compensation.findEmployeeIdsWithCompensationHistory(newHireEmployeeIds);

  return records.flatMap((record) => {
    if (record.reason !== "New Hire" || !employeeIdsWithHistory.has(record.employeeId)) {
      return [];
    }

    return [
      {
        rowNumber: record.rowNumber,
        field: "reason",
        message: `Employee "${record.employeeId}" already has compensation history; use a different reason`,
      },
    ];
  });
}
