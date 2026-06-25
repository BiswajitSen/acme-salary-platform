import { z } from "zod";

export const COMPENSATION_REASONS = [
  "Annual Increment",
  "Promotion",
  "Market Adjustment",
  "Correction",
  "New Hire",
] as const;

export type CompensationReason = (typeof COMPENSATION_REASONS)[number];

export const recordCompensationChangeSchema = z.object({
  baseSalary: z.number().positive("Base salary must be greater than zero"),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO 4217 code")
    .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO 4217 code")
    .transform((value) => value.toUpperCase()),
  effectiveDate: z
    .string()
    .trim()
    .min(1, "Effective date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Effective date must use YYYY-MM-DD format"),
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
