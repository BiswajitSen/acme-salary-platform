import type {
  CompensationImportPreviewResponse,
  CompensationImportResultResponse,
} from "@acme/shared";

import type { CompensationImportPreview } from "../domain/compensation-import.types.js";
import { spreadsheetRowToNewCompensationHistoryRecord } from "../domain/compensation-record.js";
import { parseCompensationSpreadsheet } from "../domain/parse-compensation-spreadsheet.js";
import {
  collectSalaryIncreaseReasonErrors,
  collectDuplicateNewHireInSpreadsheetErrors,
  collectNewHireWithExistingHistoryErrors,
  collectUnknownEmployeeIdErrors,
} from "../domain/validate-compensation-import.js";
import { CompensationImportValidationError } from "../lib/compensation-import-validation-error.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";

function toPreviewResponse(
  preview: CompensationImportPreview,
): CompensationImportPreviewResponse {
  return {
    recordCount: preview.records.length,
    errors: preview.errors,
    isValid: preview.isValid,
  };
}

export class CompensationImportService {
  constructor(
    private readonly employees: IEmployeeRepository,
    private readonly compensation: ICompensationRepository,
  ) {}

  async previewCompensationSpreadsheet(
    spreadsheetBuffer: Buffer,
  ): Promise<CompensationImportPreviewResponse> {
    const preview = await this.buildValidatedPreview(spreadsheetBuffer);
    return toPreviewResponse(preview);
  }

  async importCompensationSpreadsheet(
    spreadsheetBuffer: Buffer,
  ): Promise<CompensationImportResultResponse> {
    const preview = await this.buildValidatedPreview(spreadsheetBuffer);

    if (!preview.isValid) {
      throw new CompensationImportValidationError(
        "Compensation spreadsheet validation failed",
        preview.errors,
      );
    }

    return this.compensation.insertManyCompensationHistoryRecords(
      preview.records.map(spreadsheetRowToNewCompensationHistoryRecord),
    );
  }

  private async buildValidatedPreview(
    spreadsheetBuffer: Buffer,
  ): Promise<CompensationImportPreview> {
    const parsedPreview = parseCompensationSpreadsheet(spreadsheetBuffer);
    const employeeErrors = await collectUnknownEmployeeIdErrors(
      this.employees,
      parsedPreview.records,
    );
    const duplicateNewHireErrors = collectDuplicateNewHireInSpreadsheetErrors(
      parsedPreview.records,
    );
    const existingHistoryErrors = await collectNewHireWithExistingHistoryErrors(
      this.compensation,
      parsedPreview.records,
    );
    const salaryIncreaseErrors = await collectSalaryIncreaseReasonErrors(
      this.compensation,
      parsedPreview.records,
    );
    const errors = [
      ...parsedPreview.errors,
      ...employeeErrors,
      ...duplicateNewHireErrors,
      ...existingHistoryErrors,
      ...salaryIncreaseErrors,
    ];

    return {
      records: parsedPreview.records,
      errors,
      isValid: errors.length === 0 && parsedPreview.records.length > 0,
    };
  }
}
