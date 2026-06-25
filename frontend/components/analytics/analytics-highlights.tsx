import type { AnalyticsHighlights } from "@/lib/analytics/types";
import { formatAnalyticsPercent } from "@/lib/analytics/format-analytics-percent";
import { formatAnnualSalary } from "@/lib/analytics/format-analytics-salary";

import { AnalyticsChartCard } from "./analytics-chart-card";

import styles from "./analytics-highlights.module.css";

type AnalyticsHighlightsProps = {
  currency: string;
  highlights: AnalyticsHighlights;
};

export function AnalyticsHighlightsSection({ currency, highlights }: AnalyticsHighlightsProps) {
  const items = [
    {
      label: "Highest annual salary",
      value: highlights.highestSalary
        ? formatAnnualSalary(highlights.highestSalary.amount, currency)
        : "—",
      hint: highlights.highestSalary ? highlights.highestSalary.employeeId : "No data",
    },
    {
      label: "Lowest annual salary",
      value: highlights.lowestSalary
        ? formatAnnualSalary(highlights.lowestSalary.amount, currency)
        : "—",
      hint: highlights.lowestSalary ? highlights.lowestSalary.employeeId : "No data",
    },
    {
      label: "Payroll concentration",
      value: formatAnalyticsPercent(highlights.topTenPayrollPercent),
      hint: "Top 10 employees share of payroll",
    },
    {
      label: "Annual salary range",
      value: `${formatAnnualSalary(highlights.salaryRange.min, currency)} — ${formatAnnualSalary(highlights.salaryRange.max, currency)}`,
      hint: "Min to max annual base salary in current view",
    },
    {
      label: "Employees above median",
      value: highlights.aboveMedian.toLocaleString(),
      hint: "Count above org median",
    },
    {
      label: "Employees below median",
      value: highlights.belowMedian.toLocaleString(),
      hint: "Count below org median",
    },
    {
      label: "Avg employees per department",
      value: highlights.averageEmployeesPerDepartment.toLocaleString(),
      hint: "Headcount spread across departments",
    },
  ];

  return (
    <AnalyticsChartCard title="Analytics highlights" subtitle="Key distribution metrics">
      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.label} className={styles.card}>
            <p className={styles.label}>{item.label}</p>
            <p className={styles.value}>{item.value}</p>
            <p className={styles.hint}>{item.hint}</p>
          </article>
        ))}
      </div>
    </AnalyticsChartCard>
  );
}
