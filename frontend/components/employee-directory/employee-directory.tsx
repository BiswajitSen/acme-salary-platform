"use client";

import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusMessage } from "@/components/ui/status-message";
import { EmployeeDirectoryFilters } from "@/components/employee-directory/employee-directory-filters";
import { EmployeeDirectoryTable } from "@/components/employee-directory/employee-directory-table";
import { useEmployeeDirectory } from "@/lib/hooks/use-employee-directory";

import styles from "./employee-directory.module.css";

export function EmployeeDirectory() {
  const {
    filters,
    filterOptions,
    directory,
    page,
    isLoading,
    errorMessage,
    updateFilter,
    goToPreviousPage,
    goToNextPage,
  } = useEmployeeDirectory();

  const hasEmployees = directory.data.length > 0;
  const showEmptyState = !isLoading && !hasEmployees;

  return (
    <section className={styles.page}>
      <PageHeader
        title="Employee Directory"
        subtitle={`${directory.meta.total.toLocaleString()} employees in the organization`}
      />

      <EmployeeDirectoryFilters
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={updateFilter}
      />

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {isLoading && <StatusMessage isLoading message="Loading employees…" />}

      {showEmptyState && (
        <StatusMessage message="No employees match the current filters." />
      )}

      {!isLoading && hasEmployees && (
        <EmployeeDirectoryTable employees={directory.data} />
      )}

      <Pagination
        page={page}
        totalPages={directory.meta.totalPages}
        isLoading={isLoading}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
      />
    </section>
  );
}
