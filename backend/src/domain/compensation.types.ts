export type CompensationHistoryRecord = {
  id: number;
  employeeId: string;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: string;
  changedBy: string;
  notes: string | null;
  createdAt: string;
};
