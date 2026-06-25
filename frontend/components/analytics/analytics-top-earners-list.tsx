import type { AnalyticsTopEarnerRow } from "@/lib/analytics/types";
import { EmployeeAvatar } from "@/components/employee-directory/employee-avatar";
import { countryFlag } from "@/lib/country-flag";
import { countryLabel } from "@/lib/country-label";
import { formatAnnualSalary } from "@/lib/analytics/format-analytics-salary";

import { AnalyticsChartCard } from "./analytics-chart-card";

import styles from "./analytics-top-earners-list.module.css";

type AnalyticsTopEarnersListProps = {
  currency: string;
  earners: AnalyticsTopEarnerRow[];
};

export function AnalyticsTopEarnersList({ currency, earners }: AnalyticsTopEarnersListProps) {
  return (
    <AnalyticsChartCard title="Top earners" subtitle="Ranked by annual base salary">
      {earners.length === 0 ? (
        <p className={styles.empty}>No earners found for {currency}.</p>
      ) : (
        <ol className={styles.list}>
          {earners.map((earner, index) => {
            const isTopThree = index < 3;

            return (
              <li
                key={earner.employeeId}
                className={`${styles.item} ${isTopThree ? styles.topThree : ""}`}
              >
                <span className={styles.rank}>{index + 1}</span>
                <EmployeeAvatar fullName={earner.fullName} />
                <div className={styles.details}>
                  <p className={styles.name}>{earner.fullName}</p>
                  <p className={styles.meta}>
                    {earner.employeeId} · {earner.department} · {countryFlag(earner.country)}{" "}
                    {countryLabel(earner.country)}
                  </p>
                </div>
                <span className={styles.salary}>
                  {formatAnnualSalary(earner.baseSalary, currency)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </AnalyticsChartCard>
  );
}
