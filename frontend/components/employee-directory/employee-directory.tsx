"use client";

import type { ChangeEvent } from "react";
import type { EmployeeFilterOptions, PaginatedEmployeesResponse } from "@acme/shared";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  listEmployeeFilterOptions,
  listEmployees,
  type EmployeeListParams,
} from "@/lib/api/employees";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

import styles from "./employee-directory.module.css";

const ROW_HEIGHT_PX = 48;
const SEARCH_DEBOUNCE_MS = 300;

type DirectoryFilters = {
  search: string;
  country: string;
  department: string;
  jobTitle: string;
};

const emptyFilters: DirectoryFilters = {
  search: "",
  country: "",
  department: "",
  jobTitle: "",
};

function renderFilterOption(value: string) {
  return (
    <option key={value} value={value}>
      {value}
    </option>
  );
}

function estimateEmployeeRowHeight() {
  return ROW_HEIGHT_PX;
}

export function EmployeeDirectory() {
  const [filters, setFilters] = useState<DirectoryFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState<EmployeeFilterOptions>({
    countries: [],
    departments: [],
    jobTitles: [],
  });
  const [directory, setDirectory] = useState<PaginatedEmployeesResponse>({
    data: [],
    meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const loadDirectory = useCallback(async (params: EmployeeListParams) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listEmployees(params);
      setDirectory(response);
    } catch {
      setErrorMessage("Unable to load employees. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void listEmployeeFilterOptions()
      .then(setFilterOptions)
      .catch(() => {
        setErrorMessage("Unable to load filter options.");
      });
  }, []);

  useEffect(() => {
    void loadDirectory({
      page,
      search: debouncedSearch || undefined,
      country: filters.country || undefined,
      department: filters.department || undefined,
      jobTitle: filters.jobTitle || undefined,
    });
  }, [
    debouncedSearch,
    filters.country,
    filters.department,
    filters.jobTitle,
    loadDirectory,
    page,
  ]);

  const rowVirtualizer = useVirtualizer({
    count: directory.data.length,
    getScrollElement: () => listContainerRef.current,
    estimateSize: estimateEmployeeRowHeight,
    overscan: 8,
  });

  function updateFilter<Key extends keyof DirectoryFilters>(
    key: Key,
    value: DirectoryFilters[Key],
  ) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    updateFilter("search", event.target.value);
  }

  function handleCountryChange(event: ChangeEvent<HTMLSelectElement>) {
    updateFilter("country", event.target.value);
  }

  function handleDepartmentChange(event: ChangeEvent<HTMLSelectElement>) {
    updateFilter("department", event.target.value);
  }

  function handleJobTitleChange(event: ChangeEvent<HTMLSelectElement>) {
    updateFilter("jobTitle", event.target.value);
  }

  function goToPreviousPage() {
    setPage((current) => current - 1);
  }

  function goToNextPage() {
    setPage((current) => current + 1);
  }

  function renderVirtualEmployeeRow(virtualRow: { index: number; start: number }) {
    const employee = directory.data[virtualRow.index];
    if (!employee) {
      return null;
    }

    return (
      <div
        key={employee.id}
        className={styles.tableRow}
        style={{ transform: `translateY(${virtualRow.start}px)` }}
      >
        <span>{employee.id}</span>
        <span>{employee.fullName}</span>
        <span>{employee.department}</span>
        <span>{employee.jobTitle}</span>
        <span>{employee.country}</span>
      </div>
    );
  }

  return (
    <section className={styles.directory}>
      <header className={styles.header}>
        <div>
          <h1>Employee Directory</h1>
          <p>{directory.meta.total} employees</p>
        </div>
      </header>

      <div className={styles.filters}>
        <input
          type="search"
          placeholder="Search by name or employee ID"
          value={filters.search}
          onChange={handleSearchChange}
          aria-label="Search employees"
        />
        <select
          value={filters.country}
          onChange={handleCountryChange}
          aria-label="Filter by country"
        >
          <option value="">All countries</option>
          {filterOptions.countries.map(renderFilterOption)}
        </select>
        <select
          value={filters.department}
          onChange={handleDepartmentChange}
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {filterOptions.departments.map(renderFilterOption)}
        </select>
        <select
          value={filters.jobTitle}
          onChange={handleJobTitleChange}
          aria-label="Filter by job title"
        >
          <option value="">All job titles</option>
          {filterOptions.jobTitles.map(renderFilterOption)}
        </select>
      </div>

      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}

      {isLoading && <p className={styles.status}>Loading employees…</p>}

      {!isLoading && directory.data.length === 0 && (
        <p className={styles.status}>No employees match the current filters.</p>
      )}

      {!isLoading && directory.data.length > 0 && (
        <div className={styles.tableShell}>
          <div className={styles.tableHeader}>
            <span>Employee ID</span>
            <span>Name</span>
            <span>Department</span>
            <span>Job title</span>
            <span>Country</span>
          </div>
          <div ref={listContainerRef} className={styles.tableBody}>
            <div
              className={styles.virtualRows}
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map(renderVirtualEmployeeRow)}
            </div>
          </div>
        </div>
      )}

      <footer className={styles.pagination}>
        <button
          type="button"
          disabled={page <= 1 || isLoading}
          onClick={goToPreviousPage}
        >
          Previous
        </button>
        <span>
          Page {directory.meta.page} of {Math.max(directory.meta.totalPages, 1)}
        </span>
        <button
          type="button"
          disabled={page >= directory.meta.totalPages || isLoading}
          onClick={goToNextPage}
        >
          Next
        </button>
      </footer>
    </section>
  );
}
