import type { ChangeEvent } from "react";

import type { EmployeeFilterOptions } from "@acme/shared";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { DirectoryFilters } from "@/components/employee-directory/types";

import styles from "./employee-directory-filters.module.css";

type EmployeeDirectoryFiltersProps = {
  filters: DirectoryFilters;
  filterOptions: EmployeeFilterOptions;
  onFilterChange: <Key extends keyof DirectoryFilters>(
    key: Key,
    value: DirectoryFilters[Key],
  ) => void;
};

function renderFilterOption(value: string) {
  return (
    <option key={value} value={value}>
      {value}
    </option>
  );
}

export function EmployeeDirectoryFilters({
  filters,
  filterOptions,
  onFilterChange,
}: EmployeeDirectoryFiltersProps) {
  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    onFilterChange("search", event.target.value);
  }

  function handleCountryChange(event: ChangeEvent<HTMLSelectElement>) {
    onFilterChange("country", event.target.value);
  }

  function handleDepartmentChange(event: ChangeEvent<HTMLSelectElement>) {
    onFilterChange("department", event.target.value);
  }

  function handleJobTitleChange(event: ChangeEvent<HTMLSelectElement>) {
    onFilterChange("jobTitle", event.target.value);
  }

  return (
    <section className={styles.filters} aria-label="Employee filters">
      <Input
        type="search"
        placeholder="Search by name or employee ID"
        value={filters.search}
        onChange={handleSearchChange}
        aria-label="Search employees"
      />
      <Select
        value={filters.country}
        onChange={handleCountryChange}
        aria-label="Filter by country"
      >
        <option value="">All countries</option>
        {filterOptions.countries.map(renderFilterOption)}
      </Select>
      <Select
        value={filters.department}
        onChange={handleDepartmentChange}
        aria-label="Filter by department"
      >
        <option value="">All departments</option>
        {filterOptions.departments.map(renderFilterOption)}
      </Select>
      <Select
        value={filters.jobTitle}
        onChange={handleJobTitleChange}
        aria-label="Filter by job title"
      >
        <option value="">All job titles</option>
        {filterOptions.jobTitles.map(renderFilterOption)}
      </Select>
    </section>
  );
}
