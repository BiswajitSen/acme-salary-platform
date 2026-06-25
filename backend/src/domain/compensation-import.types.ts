import { COMPENSATION_REASONS, isoCurrencyCodeSchema, isoDateSchema } from "@acme/shared";
import { z } from "zod";

export const compensationSpreadsheetRowSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  baseSalary: z.coerce.number().positive("Base salary must be greater than zero"),
  currency: isoCurrencyCodeSchema,
  effectiveDate: isoDateSchema,
  reason: z.enum(COMPENSATION_REASONS, {
    errorMap: () => ({ message: "Reason must be a valid compensation reason" }),
  }),
  changedBy: z.string().trim().min(1, "Changed by is required"),
  notes: z.preprocess(
    (value) =>
      value === undefined || value === null || String(value).trim() === ""
        ? null
        : String(value).trim(),
    z.string().nullable(),
  ),
});

export type CompensationSpreadsheetRow = z.infer<typeof compensationSpreadsheetRowSchema>;

export type ParsedCompensationSpreadsheetRow = CompensationSpreadsheetRow & {
  rowNumber: number;
};

export type CompensationImportError = {
  rowNumber: number;
  field: string;
  message: string;
};

export type CompensationImportPreview = {
  records: ParsedCompensationSpreadsheetRow[];
  errors: CompensationImportError[];
  isValid: boolean;
};

export type CompensationImportResult = {
  inserted: number;
  total: number;
};
