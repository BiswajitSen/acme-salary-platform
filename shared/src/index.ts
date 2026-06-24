export const COMPENSATION_REASONS = [
  "Annual Increment",
  "Promotion",
  "Market Adjustment",
  "Correction",
  "New Hire",
] as const;

export type CompensationReason = (typeof COMPENSATION_REASONS)[number];

export type HealthStatus = {
  status: "ok";
  database: "connected";
  employees: number;
  compensationRecords: number;
};

export type ApiError = {
  error: string;
  message: string;
};
