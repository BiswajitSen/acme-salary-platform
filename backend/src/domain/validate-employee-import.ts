import type { EmployeeImportError, EmployeeSpreadsheetRow } from "./employee-import.types.js";

export function collectDuplicateEmployeeIdErrors(
  employees: EmployeeSpreadsheetRow[],
): EmployeeImportError[] {
  const seenIds = new Map<string, number>();
  const errors: EmployeeImportError[] = [];

  for (const [index, employee] of employees.entries()) {
    const firstRowNumber = seenIds.get(employee.id);

    if (firstRowNumber !== undefined) {
      errors.push({
        rowNumber: index + 2,
        field: "id",
        message: `Duplicate employee ID "${employee.id}" (first seen on row ${firstRowNumber})`,
      });
      continue;
    }

    seenIds.set(employee.id, index + 2);
  }

  return errors;
}
