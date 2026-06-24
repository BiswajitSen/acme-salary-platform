export type DepartmentSalaryStatisticsRecord = {
  department: string;
  employeeCount: number;
  averageSalary: number;
  medianSalary: number;
};

export type TopEarnerRecord = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
};
