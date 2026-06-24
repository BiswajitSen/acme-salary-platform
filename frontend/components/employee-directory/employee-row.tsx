import type { EmployeeSummary } from "@acme/shared";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

import styles from "./employee-row.module.css";

type EmployeeRowProps = {
  employee: EmployeeSummary;
  offsetY: number;
};

export function EmployeeRow({ employee, offsetY }: EmployeeRowProps) {
  return (
    <Link
      href={`/employees/${employee.id}`}
      className={styles.row}
      style={{ transform: `translateY(${offsetY}px)` }}
      data-testid={`employee-row-${employee.id}`}
    >
      <span className={styles.id}>{employee.id}</span>
      <span className={styles.name}>{employee.fullName}</span>
      <span className={styles.muted}>{employee.department}</span>
      <span className={styles.muted}>{employee.jobTitle}</span>
      <Badge label={employee.country} />
    </Link>
  );
}
