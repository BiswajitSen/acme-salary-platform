"use client";

import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmployeeDirectoryKpiCards } from "@/components/employee-directory/employee-directory-kpi-cards";
import { EmployeeDirectorySearch } from "@/components/employee-directory/employee-directory-search";
import { EmployeeDirectoryTable } from "@/components/employee-directory/employee-directory-table";
import { Button } from "@/components/ui/button";
import { useDisplayCurrency } from "@/lib/hooks/use-display-currency";
import { useEmployeeDirectory } from "@/lib/hooks/use-employee-directory";
import { useExchangeRates } from "@/lib/hooks/use-exchange-rates";

import styles from "./employee-directory.module.css";

export function EmployeeDirectory() {
  const { currency: displayCurrency } = useDisplayCurrency();
  const { ratesToUsd } = useExchangeRates();
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

  return (
    <section className={styles.page}>
      <PageHeader
        title="Employee Directory"
        subtitle="Find people quickly, review compensation at a glance, and open profiles from one place."
        actions={
          <Link href="/employees/new">
            <Button variant="primary">Add employee</Button>
          </Link>
        }
      />

      <EmployeeDirectoryKpiCards
        stats={directory.stats}
        employmentStatuses={filters.employmentStatuses}
        onEmploymentStatusFilterChange={(statuses) =>
          updateFilter("employmentStatuses", statuses)
        }
      />

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      <EmployeeDirectorySearch
        value={filters.search}
        onChange={(value) => updateFilter("search", value)}
      />

      <EmployeeDirectoryTable
        employees={directory.data}
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={updateFilter}
        displayCurrency={displayCurrency}
        ratesToUsd={ratesToUsd}
        isLoading={isLoading}
      />

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
