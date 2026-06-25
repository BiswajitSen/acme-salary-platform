import type { ParsedCompensationSpreadsheetRow } from "./compensation-import.types.js";
import type { CompensationImportError } from "./compensation-import.types.js";
import type { CompensationHistoryRecord } from "./compensation.types.js";
import {
  isSalaryIncreaseReason,
  validateSalaryIncreaseReason,
} from "./validate-compensation-change.js";
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

function toSimulatedHistoryRecord(
  employeeId: string,
  record: ParsedCompensationSpreadsheetRow,
): CompensationHistoryRecord {
  return {
    id: record.rowNumber,
    employeeId,
    baseSalary: record.baseSalary,
    currency: record.currency,
    effectiveDate: record.effectiveDate,
    reason: record.reason,
    changedBy: record.changedBy,
    notes: record.notes,
    createdAt: `1970-01-01T00:00:00.${String(record.rowNumber).padStart(3, "0")}Z`,
  };
}

export function collectSalaryIncreaseReasonErrorsFromHistory(
  existingHistoryByEmployee: Map<string, CompensationHistoryRecord[]>,
  records: ParsedCompensationSpreadsheetRow[],
): CompensationImportError[] {
  const recordsByEmployee = new Map<string, ParsedCompensationSpreadsheetRow[]>();

  for (const record of records) {
    const employeeRecords = recordsByEmployee.get(record.employeeId) ?? [];
    employeeRecords.push(record);
    recordsByEmployee.set(record.employeeId, employeeRecords);
  }

  return [...recordsByEmployee.entries()].flatMap(([employeeId, employeeRecords]) => {
    const sortedRecords = [...employeeRecords].sort((left, right) => {
      const effectiveDateCompare = left.effectiveDate.localeCompare(right.effectiveDate);

      if (effectiveDateCompare !== 0) {
        return effectiveDateCompare;
      }

      return left.rowNumber - right.rowNumber;
    });

    const simulatedHistory = [...(existingHistoryByEmployee.get(employeeId) ?? [])];

    return sortedRecords.flatMap((record) => {
      const errors: CompensationImportError[] = [];

      if (isSalaryIncreaseReason(record.reason)) {
        const validationError = validateSalaryIncreaseReason(simulatedHistory, record);

        if (validationError) {
          errors.push({
            rowNumber: record.rowNumber,
            field: "baseSalary",
            message: validationError,
          });
        }
      }

      simulatedHistory.push(toSimulatedHistoryRecord(employeeId, record));
      return errors;
    });
  });
}

export async function collectSalaryIncreaseReasonErrors(
  compensation: ICompensationRepository,
  records: ParsedCompensationSpreadsheetRow[],
): Promise<CompensationImportError[]> {
  const employeeIds = [...new Set(records.map((record) => record.employeeId))];
  const existingHistoryByEmployee =
    await compensation.findCompensationHistoryByEmployeeIds(employeeIds);

  return collectSalaryIncreaseReasonErrorsFromHistory(existingHistoryByEmployee, records);
}
