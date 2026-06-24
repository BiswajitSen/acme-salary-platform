import type { EmployeeSummary } from "@acme/shared";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

import { EMPLOYEE_ROW_HEIGHT_PX } from "@/components/employee-directory/types";
import { EmployeeRow } from "@/components/employee-directory/employee-row";

import styles from "./employee-directory-table.module.css";

type EmployeeDirectoryTableProps = {
  employees: EmployeeSummary[];
};

function estimateEmployeeRowHeight() {
  return EMPLOYEE_ROW_HEIGHT_PX;
}

export function EmployeeDirectoryTable({ employees }: EmployeeDirectoryTableProps) {
  const listContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => listContainerRef.current,
    estimateSize: estimateEmployeeRowHeight,
    overscan: 8,
  });

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <span>Employee ID</span>
        <span>Name</span>
        <span>Department</span>
        <span>Job title</span>
        <span>Country</span>
      </div>
      <div ref={listContainerRef} className={styles.body}>
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
                offsetY={virtualRow.start}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
