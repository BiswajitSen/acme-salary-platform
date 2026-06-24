import type { CompensationReason } from "@acme/shared";

export type CompensationHistoryRecord = {
  id: number;
  employeeId: string;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: CompensationReason;
  changedBy: string;
  notes: string | null;
  createdAt: string;
};
