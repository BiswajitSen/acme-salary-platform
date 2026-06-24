import type { TopEarner } from "@acme/shared";

import { Card } from "@/components/ui/card";
import { formatSalary } from "@/lib/format-salary";

import styles from "./analytics-top-earners-list.module.css";

type AnalyticsTopEarnersListProps = {
  currency: string;
  earners: TopEarner[];
};

export function AnalyticsTopEarnersList({
  currency,
  earners,
}: AnalyticsTopEarnersListProps) {
  return (
    <Card title="Top earners">
      {earners.length === 0 ? (
        <p className={styles.empty}>No earners found for {currency}.</p>
      ) : (
        <ol className={styles.list}>
          {earners.map((earner, index) => (
            <li key={earner.employeeId} className={styles.item}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.details}>
                <p className={styles.name}>{earner.fullName}</p>
                <p className={styles.meta}>
                  {earner.employeeId} · {earner.department}
                </p>
              </div>
              <span className={styles.salary}>
                {formatSalary(earner.baseSalary, currency)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
