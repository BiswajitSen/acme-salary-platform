import type { ReactNode } from "react";

import type { EmployeeFilterOptions } from "@acme/shared";

import { ColumnFilterPopover } from "@/components/employee-directory/column-filter-popover";
import type { DirectoryFilters } from "@/components/employee-directory/types";
import {
  EMPLOYMENT_STATUS_FILTER_OPTIONS,
  EMPLOYMENT_STATUS_LABELS,
} from "@/components/employee-directory/types";

import styles from "./employee-directory-table.module.css";

type EmployeeDirectoryTableHeaderProps = {
  filters: DirectoryFilters;
  filterOptions: EmployeeFilterOptions;
  onFilterChange: <Key extends keyof DirectoryFilters>(
    key: Key,
    value: DirectoryFilters[Key],
  ) => void;
};

type HeaderColumnProps = {
  label: string;
  alignEnd?: boolean;
  children?: ReactNode;
};

function HeaderColumn({ label, alignEnd = false, children }: HeaderColumnProps) {
  return (
    <div className={alignEnd ? `${styles.headerCell} ${styles.headerCellEnd}` : styles.headerCell}>
      <div className={styles.headerCellRow}>
        <span className={styles.headerLabel}>{label}</span>
        {children}
      </div>
    </div>
  );
}

export function EmployeeDirectoryTableHeader({
  filters,
  filterOptions,
  onFilterChange,
}: EmployeeDirectoryTableHeaderProps) {
  return (
    <div className={styles.header}>
      <HeaderColumn label="Employee" />
      <HeaderColumn label="Role">
        <ColumnFilterPopover
          options={filterOptions.departments}
          appliedValues={filters.departments}
          onApply={(values) => onFilterChange("departments", values)}
          ariaLabel="Filter by department"
        />
        <ColumnFilterPopover
          options={filterOptions.jobTitles}
          appliedValues={filters.jobTitles}
          onApply={(values) => onFilterChange("jobTitles", values)}
          ariaLabel="Filter by job title"
        />
      </HeaderColumn>
      <HeaderColumn label="Country">
        <ColumnFilterPopover
          options={filterOptions.countries}
          appliedValues={filters.countries}
          onApply={(values) => onFilterChange("countries", values)}
          ariaLabel="Filter by country"
        />
      </HeaderColumn>
      <HeaderColumn label="Salary" />
      <HeaderColumn label="Status">
        <ColumnFilterPopover
          options={[...EMPLOYMENT_STATUS_FILTER_OPTIONS]}
          appliedValues={filters.employmentStatuses}
          onApply={(values) =>
            onFilterChange(
              "employmentStatuses",
              values as DirectoryFilters["employmentStatuses"],
            )
          }
          ariaLabel="Filter by employment status"
          getOptionLabel={(option) =>
            EMPLOYMENT_STATUS_LABELS[option as keyof typeof EMPLOYMENT_STATUS_LABELS] ??
            option
          }
        />
      </HeaderColumn>
      <HeaderColumn label="Actions" alignEnd />
    </div>
  );
}
