import type { AnalyticsDepartmentRow } from "@/lib/analytics/types";
import { formatAnnualSalary } from "@/lib/analytics/format-analytics-salary";
import { formatPayrollPercent } from "@/lib/analytics/format-analytics-percent";

import { AnalyticsChartCard } from "./analytics-chart-card";
import { AnalyticsHorizontalBarChart } from "./analytics-horizontal-bar-chart";

import styles from "./analytics-department-payroll-section.module.css";

type AnalyticsDepartmentPayrollSectionProps = {
  currency: string;
  departments: AnalyticsDepartmentRow[];
};

export function AnalyticsDepartmentPayrollSection({
  currency,
  departments,
}: AnalyticsDepartmentPayrollSectionProps) {
  const chartData = departments.map((department) => ({
    label: department.department,
    value: department.averageSalary,
  }));

  return (
    <AnalyticsChartCard
      title="Payroll by department"
      subtitle="Average annual base salary by team. Payroll % of org compares each row to total organization compensation."
    >
      <AnalyticsHorizontalBarChart
        data={chartData}
        valueFormatter={(value) => formatAnnualSalary(value, currency)}
        emptyMessage={`No department statistics available for ${currency}.`}
      />

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Department</th>
              <th className={styles.numeric}>Employees</th>
              <th className={styles.numeric}>Avg annual</th>
              <th className={styles.numeric}>Median annual</th>
              <th className={styles.numeric}>Payroll % of org</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No department statistics available.
                </td>
              </tr>
            ) : (
              departments.map((department) => (
                <tr key={department.department}>
                  <td>{department.department}</td>
                  <td className={styles.numeric}>{department.employeeCount.toLocaleString()}</td>
                  <td className={styles.numeric}>
                    {formatAnnualSalary(department.averageSalary, currency)}
                  </td>
                  <td className={styles.numeric}>
                    {formatAnnualSalary(department.medianSalary, currency)}
                  </td>
                  <td className={styles.numeric}>{formatPayrollPercent(department.payrollPercent)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {departments.length === 0 ? (
        <p className={styles.mobileEmpty}>No department statistics available.</p>
      ) : (
        <ul className={styles.mobileList}>
          {departments.map((department) => (
            <li key={department.department} className={styles.mobileCard}>
              <div className={styles.mobileHeader}>
                <span className={styles.mobileDepartment}>{department.department}</span>
                <span className={styles.mobilePayrollShare}>
                  {formatPayrollPercent(department.payrollPercent)}
                </span>
              </div>
              <p className={styles.mobileHeadcount}>
                {department.employeeCount.toLocaleString()} employees
              </p>
              <dl className={styles.mobileStats}>
                <div>
                  <dt>Avg annual</dt>
                  <dd>{formatAnnualSalary(department.averageSalary, currency)}</dd>
                </div>
                <div>
                  <dt>Median annual</dt>
                  <dd>{formatAnnualSalary(department.medianSalary, currency)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </AnalyticsChartCard>
  );
}
