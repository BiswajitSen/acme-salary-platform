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

function countActiveDataFilters(filters: AnalyticsDashboardFilters): number {
  return [filters.country, filters.department, filters.jobTitle].filter(
    (value) => value.length > 0,
  ).length;
}

export function AnalyticsFilterBar({
  filters,
  filterOptions,
  currency,
  onFilterChange,
  onCurrencyChange,
  onReset,
}: AnalyticsFilterBarProps) {
  const activeFilterCount = countActiveDataFilters(filters);

  return (
    <section className={styles.bar} aria-label="Analytics filters">
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.title}>Refine view</p>
          <p className={styles.subtitle}>
            Slice payroll and headcount by location, role, or department.
          </p>
        </div>

        <div className={styles.headerActions}>
          {activeFilterCount > 0 && (
            <span className={styles.activeBadge}>
              {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            className={styles.resetButton}
            disabled={activeFilterCount === 0}
            onClick={onReset}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.dataFilters} role="group" aria-label="Data filters">
          <label
            className={
              filters.country
                ? `${styles.filterPill} ${styles.filterPillActive}`
                : styles.filterPill
            }
          >
            <span className={styles.filterLabel}>Location</span>
            <Select
              className={styles.filterSelect}
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

          <label
            className={
              filters.jobTitle
                ? `${styles.filterPill} ${styles.filterPillActive}`
                : styles.filterPill
            }
          >
            <span className={styles.filterLabel}>Role</span>
            <Select
              className={styles.filterSelect}
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

          <label
            className={
              filters.department
                ? `${styles.filterPill} ${styles.filterPillActive}`
                : styles.filterPill
            }
          >
            <span className={styles.filterLabel}>Department</span>
            <Select
              className={styles.filterSelect}
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
        </div>

        <div className={styles.currencyGroup} role="group" aria-label="Display currency">
          <label className={styles.currencyPill}>
            <span className={styles.filterLabel}>Currency</span>
            <Select
              className={styles.filterSelect}
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
      </div>
    </section>
  );
}
