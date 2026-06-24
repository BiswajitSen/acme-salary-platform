import type { DepartmentSalaryStatistics } from "@acme/shared";

import { Card } from "@/components/ui/card";
import { formatSalary } from "@/lib/format-salary";

import styles from "./analytics-department-table.module.css";

type AnalyticsDepartmentTableProps = {
  currency: string;
  departments: DepartmentSalaryStatistics[];
};

export function AnalyticsDepartmentTable({
  currency,
  departments,
}: AnalyticsDepartmentTableProps) {
  return (
    <Card title="Salary by department">
      {departments.length === 0 ? (
        <p className={styles.empty}>No department statistics available for {currency}.</p>
      ) : (
        <div className={styles.shell}>
          <div className={styles.header}>
            <span>Department</span>
            <span>Employees</span>
            <span>Average salary</span>
            <span>Median salary</span>
          </div>
          <ul className={styles.rows}>
            {departments.map((department) => (
              <li key={department.department} className={styles.row}>
                <span>{department.department}</span>
                <span>{department.employeeCount.toLocaleString()}</span>
                <span>{formatSalary(department.averageSalary, currency)}</span>
                <span>{formatSalary(department.medianSalary, currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
