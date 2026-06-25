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

export type CompensationTimelineRecord = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: string;
};

/** @deprecated Use CompensationTimelineRecord */
export type RecentPromotionRecord = CompensationTimelineRecord;

export type TopEarnerRecord = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
};
