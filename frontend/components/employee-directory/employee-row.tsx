import type { EmployeeSummary } from "@acme/shared";
import type { ExchangeRatesToUsd } from "@acme/shared";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { countryFlag } from "@/lib/country-flag";
import { formatDisplaySalary } from "@/lib/format-display-salary";
import { formatSalary } from "@/lib/format-salary";

import { EmployeeAvatar } from "./employee-avatar";
import styles from "./employee-row.module.css";

type EmployeeRowProps = {
  employee: EmployeeSummary;
  displayCurrency: string;
  ratesToUsd: ExchangeRatesToUsd | null;
  offsetY: number;
};

function formatEmployeeSalary(
  employee: EmployeeSummary,
  displayCurrency: string,
  ratesToUsd: ExchangeRatesToUsd | null,
): string {
  if (employee.baseSalary === null || employee.currency === null) {
    return "—";
  }

  if (ratesToUsd === null) {
    return formatSalary(employee.baseSalary, employee.currency);
  }

  return formatDisplaySalary(
    employee.baseSalary,
    employee.currency,
    displayCurrency,
    ratesToUsd,
  );
}

function employmentStatusLabel(status: EmployeeSummary["employmentStatus"]): string {
  return status === "ACTIVE" ? "Active" : "No compensation";
}

export function EmployeeRow({
  employee,
  displayCurrency,
  ratesToUsd,
  offsetY,
}: EmployeeRowProps) {
  const salaryLabel = formatEmployeeSalary(employee, displayCurrency, ratesToUsd);
  const hasSalary = employee.baseSalary !== null;

  return (
    <article
      className={styles.row}
      style={{ transform: `translateY(${offsetY}px)` }}
      data-testid={`employee-row-${employee.id}`}
    >
      <div className={styles.employeeCell}>
        <EmployeeAvatar fullName={employee.fullName} />
        <div className={styles.identity}>
          <Link href={`/employees/${employee.id}`} className={styles.nameLink}>
            {employee.fullName}
          </Link>
          <p className={styles.id}>{employee.id}</p>
        </div>
      </div>

      <div className={styles.roleCell}>
        <Badge label={employee.department} variant="department" />
        <p className={styles.jobTitle}>{employee.jobTitle}</p>
      </div>

      <div className={styles.countryCell}>
        <span className={styles.flag} aria-hidden="true">
          {countryFlag(employee.country)}
        </span>
        <span>{employee.country}</span>
      </div>

      <div className={hasSalary ? styles.salary : styles.salaryMuted}>{salaryLabel}</div>

      <Badge
        label={employmentStatusLabel(employee.employmentStatus)}
        variant={employee.employmentStatus === "ACTIVE" ? "statusActive" : "statusInactive"}
      />

      <div className={styles.actions}>
        <Link href={`/employees/${employee.id}`} className={styles.viewLink}>
          View
        </Link>
      </div>
    </article>
  );
}
