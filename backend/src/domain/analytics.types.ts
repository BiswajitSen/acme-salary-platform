export type ScopedSalaryStatisticsRecord = {
  employeeCount: number;
  averageSalary: number;
  medianSalary: number;
};

export type DepartmentSalaryStatisticsRecord = {
  department: string;
  employeeCount: number;
  averageSalary: number;
  medianSalary: number;
};

import type { CompensationReason } from "@acme/shared";

export type CompensationTimelineRecord = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: CompensationReason;
};

/** @deprecated Use CompensationTimelineRecord */
export type RecentPromotionRecord = CompensationTimelineRecord;

export type MedianSplitCountsRecord = {
  medianSalary: number;
  belowMedianCount: number;
  aboveMedianCount: number;
  employeeCount: number;
};

export type TopEarnerRecord = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
};
