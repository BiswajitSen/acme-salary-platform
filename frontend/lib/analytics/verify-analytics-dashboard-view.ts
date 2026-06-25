import type { AnalyticsDashboardView, CompensatedEmployeeRecord } from "./types";
import { sumDisplaySalaries } from "./analytics-math";

export function verifyAnalyticsDashboardView(
  view: AnalyticsDashboardView,
  employees: CompensatedEmployeeRecord[],
): string[] {
  const issues: string[] = [];

  if (employees.length === 0) {
    return issues;
  }

  const employeePayrollTotal = sumDisplaySalaries(employees);
  const histogramTotal = view.histogram.reduce((sum, bucket) => sum + bucket.count, 0);

  if (histogramTotal !== employees.length) {
    issues.push(
      `Histogram counts ${histogramTotal} employees but workforce has ${employees.length}.`,
    );
  }

  const headcountTotal = view.headcountByDepartment.reduce(
    (sum, slice) => sum + slice.count,
    0,
  );

  if (headcountTotal !== employees.length) {
    issues.push(
      `Headcount slices total ${headcountTotal} but workforce has ${employees.length}.`,
    );
  }

  const medianSplitTotal =
    view.highlights.aboveMedian + view.highlights.belowMedian + view.highlights.atMedian;

  if (medianSplitTotal !== employees.length) {
    issues.push(
      `Median split counts ${medianSplitTotal} but workforce has ${employees.length}.`,
    );
  }

  if (view.highlights.highestSalary && view.highlights.lowestSalary) {
    if (view.highlights.highestSalary.amount < view.highlights.lowestSalary.amount) {
      issues.push("Highest salary is lower than lowest salary.");
    }
  }

  const departmentPayrollSum = view.departments.reduce((sum, department) => {
    const employeeDepartmentPayroll = employees
      .filter((employee) => employee.department === department.department)
      .reduce((total, employee) => total + employee.displaySalary, 0);

    return sum + employeeDepartmentPayroll;
  }, 0);

  if (
    employeePayrollTotal > 0 &&
    Math.abs(departmentPayrollSum - employeePayrollTotal) / employeePayrollTotal > 0.001
  ) {
    issues.push("Department payroll sums do not reconcile with employee payroll total.");
  }

  if (view.kpis.averageSalary > 0 && view.kpis.headcount > 0) {
    const impliedAverage = Math.round(view.kpis.totalPayroll / view.kpis.headcount);
    if (Math.abs(impliedAverage - view.kpis.averageSalary) > 1) {
      issues.push("Average salary is inconsistent with total payroll and headcount.");
    }
  }

  return issues;
}
