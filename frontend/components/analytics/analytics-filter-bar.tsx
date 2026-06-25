"use client";

import type { AnalyticsDashboardFilters } from "@/lib/analytics/types";
import type { EmployeeFilterOptions } from "@acme/shared";
import { ANALYTICS_DISPLAY_CURRENCIES } from "@acme/shared";

import { countryFlag } from "@/lib/country-flag";
import { countryLabel } from "@/lib/country-label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

import styles from "./analytics-filter-bar.module.css";

type AnalyticsFilterBarProps = {
  filters: AnalyticsDashboardFilters;
  filterOptions: EmployeeFilterOptions;
  currency: string;
  onFilterChange: <K extends keyof AnalyticsDashboardFilters>(
    key: K,
    value: AnalyticsDashboardFilters[K],
  ) => void;
  onCurrencyChange: (currency: string) => void;
  onReset: () => void;
};

export function AnalyticsFilterBar({
  filters,
  filterOptions,
  currency,
  onFilterChange,
  onCurrencyChange,
  onReset,
}: AnalyticsFilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.filters}>
        <label className={styles.filter}>
          <span className={styles.filterLabel}>🌍 Location</span>
          <Select
            aria-label="Location filter"
            value={filters.country}
            onChange={(event) => onFilterChange("country", event.target.value)}
          >
            <option value="">All locations</option>
            {filterOptions.countries.map((country) => (
              <option key={country} value={country}>
                {countryFlag(country)} {countryLabel(country)}
              </option>
            ))}
          </Select>
        </label>

        <label className={styles.filter}>
          <span className={styles.filterLabel}>👤 Role</span>
          <Select
            aria-label="Role filter"
            value={filters.jobTitle}
            onChange={(event) => onFilterChange("jobTitle", event.target.value)}
          >
            <option value="">All roles</option>
            {filterOptions.jobTitles.map((jobTitle) => (
              <option key={jobTitle} value={jobTitle}>
                {jobTitle}
              </option>
            ))}
          </Select>
        </label>

        <label className={styles.filter}>
          <span className={styles.filterLabel}>🏢 Department</span>
          <Select
            aria-label="Department filter"
            value={filters.department}
            onChange={(event) => onFilterChange("department", event.target.value)}
          >
            <option value="">All departments</option>
            {filterOptions.departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        </label>

        <label className={styles.filter}>
          <span className={styles.filterLabel}>💱 Currency</span>
          <Select
            aria-label="Display currency"
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value)}
          >
            {ANALYTICS_DISPLAY_CURRENCIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <Button type="button" variant="secondary" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
