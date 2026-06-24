import type { EmployeeImportPreview } from "../domain/employee-import.types.js";
import { parseEmployeeSpreadsheet } from "../domain/parse-employee-spreadsheet.js";
import { EmployeeImportValidationError } from "../lib/employee-import-validation-error.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";

export class EmployeeImportService {
  constructor(private readonly employees: IEmployeeRepository) {}

  previewEmployeeSpreadsheet(spreadsheetBuffer: Buffer): EmployeeImportPreview {
    return parseEmployeeSpreadsheet(spreadsheetBuffer);
  }

  async importEmployeeSpreadsheet(spreadsheetBuffer: Buffer) {
    const preview = this.previewEmployeeSpreadsheet(spreadsheetBuffer);

    if (!preview.isValid) {
      throw new EmployeeImportValidationError(
        "Employee spreadsheet validation failed",
        preview.errors,
      );
    }

    return this.employees.upsertManyEmployees(preview.employees);
  }
}
