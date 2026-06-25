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

export type RecentPromotionRecord = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
};

export type TopEarnerRecord = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
};
