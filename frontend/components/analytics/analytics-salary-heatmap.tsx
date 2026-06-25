"use client";

import type { AnalyticsDashboardView } from "@/lib/analytics/types";
import { countryLabel } from "@/lib/country-label";
import { formatAnnualSalary } from "@/lib/analytics/format-analytics-salary";

import styles from "./analytics-salary-heatmap.module.css";

type AnalyticsSalaryHeatmapProps = {
  currency: string;
  heatmap: AnalyticsDashboardView["heatmap"];
};

function heatmapTone(value: number | null, max: number): "high" | "medium" | "low" | "noData" {
  if (value === null || max === 0) {
    return "noData";
  }

  const ratio = value / max;

  if (ratio > 0.8) {
    return "high";
  }

  if (ratio > 0.55) {
    return "medium";
  }

  return "low";
}

export function AnalyticsSalaryHeatmap({ currency, heatmap }: AnalyticsSalaryHeatmapProps) {
  const values = heatmap.cells
    .map((cell) => cell.averageSalary)
    .filter((value): value is number => value !== null);
  const max = values.length > 0 ? Math.max(...values) : 0;

  if (heatmap.countries.length === 0 || heatmap.departments.length === 0) {
    return <p className={styles.emptyMessage}>No heatmap data available for the current filters.</p>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Location</th>
            {heatmap.departments.map((department) => (
              <th key={department}>{department}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmap.countries.map((country) => (
            <tr key={country}>
              <th scope="row">{countryLabel(country)}</th>
              {heatmap.departments.map((department) => {
                const cell = heatmap.cells.find(
                  (entry) => entry.country === country && entry.department === department,
                );
                const value = cell?.averageSalary ?? null;

                return (
                  <td key={`${country}-${department}`}>
                    <div
                      className={`${styles.cell} ${styles[heatmapTone(value, max)]}`}
                      title={
                        value === null
                          ? "No data"
                          : `${countryLabel(country)} · ${department}: ${formatAnnualSalary(value, currency)}/yr`
                      }
                    >
                      {value === null ? "—" : formatAnnualSalary(value, currency)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
