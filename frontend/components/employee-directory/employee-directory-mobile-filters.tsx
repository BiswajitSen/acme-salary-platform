import type { EmployeeFilterOptions } from "@acme/shared";

import { ColumnFilterPopover } from "@/components/employee-directory/column-filter-popover";
import type { DirectoryFilters } from "@/components/employee-directory/types";
import {
  EMPLOYMENT_STATUS_FILTER_OPTIONS,
  EMPLOYMENT_STATUS_LABELS,
} from "@/components/employee-directory/types";

import styles from "./employee-directory-table.module.css";

type EmployeeDirectoryMobileFiltersProps = {
  filters: DirectoryFilters;
  filterOptions: EmployeeFilterOptions;
  onFilterChange: <Key extends keyof DirectoryFilters>(
    key: Key,
    value: DirectoryFilters[Key],
  ) => void;
};

export function EmployeeDirectoryMobileFilters({
  filters,
  filterOptions,
  onFilterChange,
}: EmployeeDirectoryMobileFiltersProps) {
  return (
    <div className={styles.mobileFilters} aria-label="Employee filters">
      <ColumnFilterPopover
        variant="sheet"
        sheetLabel="Department"
        options={filterOptions.departments}
        appliedValues={filters.departments}
        onApply={(values) => onFilterChange("departments", values)}
        ariaLabel="Filter by department"
      />

      <ColumnFilterPopover
        variant="sheet"
        sheetLabel="Job title"
        options={filterOptions.jobTitles}
        appliedValues={filters.jobTitles}
        onApply={(values) => onFilterChange("jobTitles", values)}
        ariaLabel="Filter by job title"
      />

      <ColumnFilterPopover
        variant="sheet"
        sheetLabel="Country"
        options={filterOptions.countries}
        appliedValues={filters.countries}
        onApply={(values) => onFilterChange("countries", values)}
        ariaLabel="Filter by country"
      />

      <ColumnFilterPopover
        variant="sheet"
        sheetLabel="Status"
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
    </div>
  );
}
