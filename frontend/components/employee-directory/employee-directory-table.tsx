import type { EmployeeSummary } from "@acme/shared";
import type { EmployeeFilterOptions, ExchangeRatesToUsd } from "@acme/shared";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

import { EmployeeDirectoryTableHeader } from "@/components/employee-directory/employee-directory-table-header";
import { EMPLOYEE_ROW_HEIGHT_PX } from "@/components/employee-directory/types";
import { EmployeeRow } from "@/components/employee-directory/employee-row";
import type { DirectoryFilters } from "@/components/employee-directory/types";

import styles from "./employee-directory-table.module.css";

type EmployeeDirectoryTableProps = {
  employees: EmployeeSummary[];
  filters: DirectoryFilters;
  filterOptions: EmployeeFilterOptions;
  onFilterChange: <Key extends keyof DirectoryFilters>(
    key: Key,
    value: DirectoryFilters[Key],
  ) => void;
  displayCurrency: string;
  ratesToUsd: ExchangeRatesToUsd | null;
  isLoading?: boolean;
};

function estimateEmployeeRowHeight() {
  return EMPLOYEE_ROW_HEIGHT_PX;
}

export function EmployeeDirectoryTable({
  employees,
  filters,
  filterOptions,
  onFilterChange,
  displayCurrency,
  ratesToUsd,
  isLoading = false,
}: EmployeeDirectoryTableProps) {
  const listContainerRef = useRef<HTMLDivElement>(null);

  // TanStack Virtual returns unstable function references; safe to use here.
  // eslint-disable-next-line react-hooks/incompatible-library -- virtualization library limitation
  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => listContainerRef.current,
    estimateSize: estimateEmployeeRowHeight,
    overscan: 8,
  });

  return (
    <div className={styles.shell}>
      <EmployeeDirectoryTableHeader
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={onFilterChange}
      />
      <div ref={listContainerRef} className={styles.body}>
        {isLoading && employees.length === 0 ? (
          <p className={styles.bodyMessage}>Loading employees…</p>
        ) : employees.length === 0 ? (
          <p className={styles.bodyMessage}>No employees match the current filters.</p>
        ) : (
          <div
            className={styles.virtualRows}
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const employee = employees[virtualRow.index];
              if (!employee) {
                return null;
              }

              return (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  displayCurrency={displayCurrency}
                  ratesToUsd={ratesToUsd}
                  offsetY={virtualRow.start}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
