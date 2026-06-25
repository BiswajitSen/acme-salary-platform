export type AnalyticsDashboardFilters = {
  country: string;
  department: string;
  jobTitle: string;
};

export const EMPTY_ANALYTICS_FILTERS: AnalyticsDashboardFilters = {
  country: "",
  department: "",
  jobTitle: "",
};

export type CompensatedEmployeeRecord = {
  id: string;
  fullName: string;
  department: string;
  jobTitle: string;
  country: string;
  displaySalary: number;
};

export type AnalyticsDepartmentRow = {
  department: string;
  employeeCount: number;
  averageSalary: number;
  medianSalary: number;
  payrollPercent: number;
};

export type AnalyticsLocationRow = {
  country: string;
  label: string;
  payroll: number;
  employeeCount: number;
  averageSalary: number;
};

export type AnalyticsRoleRow = {
  jobTitle: string;
  averageSalary: number;
  employeeCount: number;
};

export type AnalyticsHeadcountSlice = {
  department: string;
  count: number;
  percent: number;
};

export type AnalyticsTopEarnerRow = {
  employeeId: string;
  fullName: string;
  department: string;
  country: string;
  baseSalary: number;
};

export type AnalyticsHistogramBucket = {
  label: string;
  count: number;
};

export type AnalyticsHeatmapCell = {
  country: string;
  department: string;
  averageSalary: number | null;
};

export type AnalyticsHighlights = {
  highestSalary: { amount: number; employeeId: string } | null;
  lowestSalary: { amount: number; employeeId: string } | null;
  topTenPayrollPercent: number;
  salaryRange: { min: number; max: number };
  aboveMedian: number;
  belowMedian: number;
  atMedian: number;
  averageEmployeesPerDepartment: number;
};

export type AnalyticsKpiSnapshot = {
  headcount: number;
  totalPayroll: number;
  averageSalary: number;
  medianSalary: number;
  highestPaidDepartment: { name: string; averageSalary: number } | null;
  highestPaidLocation: { name: string; averageSalary: number } | null;
};

export type AnalyticsDashboardView = {
  currency: string;
  exchangeRatesAsOf: string;
  kpis: AnalyticsKpiSnapshot;
  departments: AnalyticsDepartmentRow[];
  locations: AnalyticsLocationRow[];
  roles: AnalyticsRoleRow[];
  headcountByDepartment: AnalyticsHeadcountSlice[];
  topEarners: AnalyticsTopEarnerRow[];
  histogram: AnalyticsHistogramBucket[];
  heatmap: {
    countries: string[];
    departments: string[];
    cells: AnalyticsHeatmapCell[];
  };
  insights: string[];
  highlights: AnalyticsHighlights;
};
