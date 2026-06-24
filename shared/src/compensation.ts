export const COMPENSATION_REASONS = [
  "Annual Increment",
  "Promotion",
  "Market Adjustment",
  "Correction",
  "New Hire",
] as const;

export type CompensationReason = (typeof COMPENSATION_REASONS)[number];

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
