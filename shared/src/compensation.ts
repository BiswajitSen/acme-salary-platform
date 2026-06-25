import { z } from "zod";

import { isoCurrencyCodeSchema, requiredEffectiveDateSchema } from "./zod-fields.js";

export const COMPENSATION_REASONS = [
  "Annual Increment",
  "Promotion",
  "Market Adjustment",
  "Correction",
  "New Hire",
] as const;

export type CompensationReason = (typeof COMPENSATION_REASONS)[number];

export const SALARY_INCREASE_REASONS = [
  "Annual Increment",
  "Promotion",
] as const satisfies readonly CompensationReason[];

export type SalaryIncreaseReason = (typeof SALARY_INCREASE_REASONS)[number];

export function isSalaryIncreaseReason(
  reason: CompensationReason,
): reason is SalaryIncreaseReason {
  return (SALARY_INCREASE_REASONS as readonly CompensationReason[]).includes(reason);
}

export const NEW_HIRE_REQUIRES_EMPTY_HISTORY_MESSAGE =
  "New Hire can only be used for an employee's first compensation record";

export const recordCompensationChangeSchema = z.object({
  baseSalary: z.number().positive("Base salary must be greater than zero"),
  currency: isoCurrencyCodeSchema,
  effectiveDate: requiredEffectiveDateSchema,
  reason: z.enum(COMPENSATION_REASONS, {
    errorMap: () => ({ message: "Reason must be a valid compensation reason" }),
  }),
  changedBy: z.string().trim().min(1, "Changed by is required"),
  notes: z.string().trim().optional().nullable(),
});

export type RecordCompensationChangeInput = z.infer<typeof recordCompensationChangeSchema>;

export type RecordCompensationChangeResponse = {
  entry: CompensationTimelineEntry;
};

export type CurrentCompensation = {
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: CompensationReason;
  changedBy: string;
  lastUpdated: string;
};

export type EmployeeProfileResponse = {
  id: string;
  fullName: string;
  department: string;
  jobTitle: string;
  country: string;
  currentCompensation: CurrentCompensation | null;
};

export type CompensationTimelineEntry = {
  id: number;
  previousSalary: number | null;
  previousCurrency: string | null;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: CompensationReason;
  changedBy: string;
  notes: string | null;
  createdAt: string;
};

export type EmployeeCompensationHistoryResponse = {
  employeeId: string;
  entries: CompensationTimelineEntry[];
};

/** Timeline entries are ordered newest effective date first. */
export const COMPENSATION_TIMELINE_ORDER = "newest-first" as const;
