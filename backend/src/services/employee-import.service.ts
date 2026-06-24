import type { EmployeeImportPreview } from "../domain/employee-import.types.js";
import { parseEmployeeSpreadsheet } from "../domain/parse-employee-spreadsheet.js";
import { EmployeeImportValidationError } from "../lib/employee-import-validation-error.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";

export class EmployeeImportService {
  constructor(private readonly employees: IEmployeeRepository) {}

  previewSpreadsheet(spreadsheetBuffer: Buffer): EmployeeImportPreview {
    return parseEmployeeSpreadsheet(spreadsheetBuffer);
  }

  async importSpreadsheet(spreadsheetBuffer: Buffer) {
    const preview = this.previewSpreadsheet(spreadsheetBuffer);

    if (!preview.isValid) {
      throw new EmployeeImportValidationError(
        "Employee spreadsheet validation failed",
        preview.errors,
      );
    }

    return this.employees.upsertMany(preview.employees);
  }
}
