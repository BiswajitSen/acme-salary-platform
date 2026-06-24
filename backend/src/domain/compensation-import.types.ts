import { COMPENSATION_REASONS } from "@acme/shared";
import { z } from "zod";

export const compensationSpreadsheetRowSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  baseSalary: z.coerce.number().positive("Base salary must be greater than zero"),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO 4217 code")
    .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO 4217 code")
    .transform((value) => value.toUpperCase()),
  effectiveDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Effective date must use YYYY-MM-DD format"),
  reason: z.enum(COMPENSATION_REASONS, {
    errorMap: () => ({ message: "Reason must be a valid compensation reason" }),
  }),
  changedBy: z.string().trim().min(1, "Changed by is required"),
  notes: z.preprocess(
    (value) => (value === undefined || value === null || String(value).trim() === "" ? null : String(value).trim()),
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
