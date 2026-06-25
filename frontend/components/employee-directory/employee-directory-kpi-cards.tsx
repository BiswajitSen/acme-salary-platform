"use client";

import type { EmployeeDirectoryStats, EmployeeEmploymentStatus } from "@acme/shared";

import { isEmploymentStatusFilterActive } from "@/components/employee-directory/types";

import styles from "./employee-directory-kpi-cards.module.css";

type EmployeeDirectoryKpiCardsProps = {
  stats: EmployeeDirectoryStats;
  employmentStatuses: EmployeeEmploymentStatus[];
  onEmploymentStatusFilterChange: (statuses: EmployeeEmploymentStatus[]) => void;
};

type KpiCardProps = {
  label: string;
  value: number;
  hint: string;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
};

function KpiCard({ label, value, hint, isActive, isDisabled, onClick }: KpiCardProps) {
  const isInteractive = Boolean(onClick) && !isDisabled;

  if (!isInteractive) {
    return (
      <article className={styles.card}>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{value.toLocaleString()}</p>
        <p className={styles.hint}>{hint}</p>
      </article>
    );
  }

  return (
    <button
      type="button"
      className={isActive ? `${styles.card} ${styles.cardActive}` : styles.card}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value.toLocaleString()}</p>
      <p className={styles.hint}>{hint}</p>
    </button>
  );
}

export function EmployeeDirectoryKpiCards({
  stats,
  employmentStatuses,
  onEmploymentStatusFilterChange,
}: EmployeeDirectoryKpiCardsProps) {
  const isActiveFilter = isEmploymentStatusFilterActive(employmentStatuses, "ACTIVE");
  const isMissingFilter = isEmploymentStatusFilterActive(
    employmentStatuses,
    "NO_COMPENSATION",
  );

  return (
    <div className={styles.grid}>
      <KpiCard
        label="Total employees"
        value={stats.total}
        hint="Matching current filters"
      />
      <KpiCard
        label="Active"
        value={stats.active}
        hint="Click to show employees with compensation"
        isActive={isActiveFilter}
        isDisabled={stats.active === 0}
        onClick={() =>
          onEmploymentStatusFilterChange(isActiveFilter ? [] : ["ACTIVE"])
        }
      />
      <KpiCard
        label="Missing compensation"
        value={stats.noCompensation}
        hint="Click to show employees without salary records"
        isActive={isMissingFilter}
        isDisabled={stats.noCompensation === 0}
        onClick={() =>
          onEmploymentStatusFilterChange(isMissingFilter ? [] : ["NO_COMPENSATION"])
        }
      />
      <KpiCard
        label="Departments"
        value={stats.departments}
        hint="Represented in this view"
      />
    </div>
  );
}
