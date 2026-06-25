import type { TopEarner } from "@acme/shared";

import type { AnalyticsDepartmentRow, AnalyticsLocationRow, CompensatedEmployeeRecord } from "./types";

export function computeMedian(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1]! + sorted[middle]!) / 2);
  }

  return sorted[middle]!;
}

export function sumDisplaySalaries(employees: CompensatedEmployeeRecord[]): number {
  return employees.reduce((sum, employee) => sum + employee.displaySalary, 0);
}

export function arePayrollTotalsAligned(
  employeePayrollTotal: number,
  referencePayrollTotal: number,
  toleranceRatio = 0.02,
): boolean {
  if (referencePayrollTotal <= 0 || employeePayrollTotal <= 0) {
    return false;
  }

  return (
    Math.abs(employeePayrollTotal - referencePayrollTotal) / referencePayrollTotal <=
    toleranceRatio
  );
}

export function pickHighestPaidLocation(
  locations: AnalyticsLocationRow[],
): { name: string; averageSalary: number } | null {
  const highest = [...locations].sort(
    (left, right) => right.averageSalary - left.averageSalary,
  )[0];

  return highest ? { name: highest.label, averageSalary: highest.averageSalary } : null;
}

export function pickHighestPayrollDepartment(
  departments: AnalyticsDepartmentRow[],
): AnalyticsDepartmentRow | null {
  return [...departments].sort((left, right) => right.payrollPercent - left.payrollPercent)[0] ??
    null;
}

export function computeTopTenPayrollPercent(
  employees: CompensatedEmployeeRecord[],
  totalPayroll: number,
  apiTopEarners?: TopEarner[] | null,
): number {
  const employeePayrollTotal = sumDisplaySalaries(employees);
  const payrollTotalsAligned = arePayrollTotalsAligned(employeePayrollTotal, totalPayroll);

  const clientTopTenPayroll = [...employees]
    .sort(
      (left, right) =>
        right.displaySalary - left.displaySalary || left.id.localeCompare(right.id),
    )
    .slice(0, 10)
    .reduce((sum, employee) => sum + employee.displaySalary, 0);

  const apiTopTenPayroll =
    apiTopEarners && apiTopEarners.length > 0
      ? apiTopEarners.reduce((sum, earner) => sum + earner.baseSalary, 0)
      : 0;

  let topTenPayroll = clientTopTenPayroll;
  let denominator = employeePayrollTotal > 0 ? employeePayrollTotal : totalPayroll;

  if (payrollTotalsAligned && totalPayroll > 0) {
    topTenPayroll = clientTopTenPayroll;
    denominator = totalPayroll;
  } else if (apiTopTenPayroll > 0 && totalPayroll > 0) {
    topTenPayroll = apiTopTenPayroll;
    denominator = totalPayroll;
  }

  if (denominator <= 0 || topTenPayroll <= 0) {
    return 0;
  }

  const percent = (topTenPayroll / denominator) * 100;
  return Math.round(percent * 10) / 10;
}

export function applyDepartmentPayrollPercents(
  departments: AnalyticsDepartmentRow[],
  employees: CompensatedEmployeeRecord[],
  totalPayroll: number,
): AnalyticsDepartmentRow[] {
  const payrollByDepartment = new Map<string, number>();

  for (const employee of employees) {
    payrollByDepartment.set(
      employee.department,
      (payrollByDepartment.get(employee.department) ?? 0) + employee.displaySalary,
    );
  }

  return departments.map((department) => {
    const departmentPayroll =
      payrollByDepartment.get(department.department) ??
      department.averageSalary * department.employeeCount;

    return {
      ...department,
      payrollPercent:
        totalPayroll > 0
          ? Math.round((departmentPayroll / totalPayroll) * 1000) / 10
          : 0,
    };
  });
}

export function countMedianSplit(
  employees: CompensatedEmployeeRecord[],
  medianSalary: number,
): { aboveMedian: number; belowMedian: number; atMedian: number } {
  let aboveMedian = 0;
  let belowMedian = 0;
  let atMedian = 0;

  for (const employee of employees) {
    if (employee.displaySalary > medianSalary) {
      aboveMedian += 1;
    } else if (employee.displaySalary < medianSalary) {
      belowMedian += 1;
    } else {
      atMedian += 1;
    }
  }

  return { aboveMedian, belowMedian, atMedian };
}
