import type { EmployeeSummary } from "@acme/shared";
import type { ExchangeRatesToUsd } from "@acme/shared";
import Link from "next/link";

import { EMPLOYMENT_STATUS_ROW_LABELS } from "@/components/employee-directory/types";
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
  layout?: "table" | "mobile";
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
  return EMPLOYMENT_STATUS_ROW_LABELS[status];
}

type EmployeeRowMobileProps = {
  employee: EmployeeSummary;
  salaryLabel: string;
  hasSalary: boolean;
};

function EmployeeRowMobile({ employee, salaryLabel, hasSalary }: EmployeeRowMobileProps) {
  return (
    <>
      <div className={styles.mobileTop}>
        <EmployeeAvatar fullName={employee.fullName} />
        <div className={styles.mobileMain}>
          <div className={styles.mobileTitleRow}>
            <span className={styles.employeeName}>{employee.fullName}</span>
            <span className={hasSalary ? styles.mobileSalary : styles.salaryMuted}>{salaryLabel}</span>
          </div>
          <p className={styles.id}>{employee.id}</p>
        </div>
        <span className={styles.mobileChevron} aria-hidden="true">
          ›
        </span>
      </div>

      <div className={styles.mobileDetails}>
        <div className={styles.mobileRole}>
          <Badge label={employee.department} variant="department" />
          <span className={styles.jobTitle}>{employee.jobTitle}</span>
        </div>

        <div className={styles.mobileMeta}>
          <div className={styles.countryCell}>
            <span className={styles.flag} aria-hidden="true">
              {countryFlag(employee.country)}
            </span>
            <span>{employee.country}</span>
          </div>
          <div className={styles.statusCell}>
            <Badge
              label={employmentStatusLabel(employee.employmentStatus)}
              variant={employee.employmentStatus === "ACTIVE" ? "statusActive" : "statusInactive"}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function EmployeeRow({
  employee,
  displayCurrency,
  ratesToUsd,
  offsetY,
  layout = "table",
}: EmployeeRowProps) {
  const salaryLabel = formatEmployeeSalary(employee, displayCurrency, ratesToUsd);
  const hasSalary = employee.baseSalary !== null;
  const isMobileLayout = layout === "mobile";

  if (isMobileLayout) {
    return (
      <Link
        href={`/employees/${employee.id}`}
        className={`${styles.row} ${styles.rowMobile}`}
        data-testid={`employee-row-${employee.id}`}
        aria-label={`View ${employee.fullName} profile`}
      >
        <EmployeeRowMobile employee={employee} salaryLabel={salaryLabel} hasSalary={hasSalary} />
      </Link>
    );
  }

  return (
    <Link
      href={`/employees/${employee.id}`}
      className={styles.row}
      style={{ transform: `translateY(${offsetY}px)` }}
      data-testid={`employee-row-${employee.id}`}
      aria-label={`View ${employee.fullName} profile`}
    >
      <div className={styles.employeeCell}>
        <EmployeeAvatar fullName={employee.fullName} />
        <div className={styles.identity}>
          <span className={styles.employeeName}>{employee.fullName}</span>
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

      <div className={styles.statusCell}>
        <Badge
          label={employmentStatusLabel(employee.employmentStatus)}
          variant={employee.employmentStatus === "ACTIVE" ? "statusActive" : "statusInactive"}
        />
      </div>

      <div className={styles.actions}>
        <span className={styles.viewLink}>View</span>
      </div>
    </Link>
  );
}
