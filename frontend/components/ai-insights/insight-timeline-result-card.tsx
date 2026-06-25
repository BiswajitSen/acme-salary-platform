import type { InsightTimelineEvent } from "@acme/shared";

import { Card } from "@/components/ui/card";
import { formatInsightTimelineScopeMeta } from "@/lib/format-insight-scope-meta";
import { formatSalary } from "@/lib/format-salary";

import styles from "./insight-execution-result.module.css";

type InsightTimelineResultCardProps = {
  title: string;
  emptyMessage: string;
  months: number;
  country: string | null;
  department: string | null;
  events: InsightTimelineEvent[];
};

export function InsightTimelineResultCard({
  title,
  emptyMessage,
  months,
  country,
  department,
  events,
}: InsightTimelineResultCardProps) {
  return (
    <Card title={title}>
      <p className={styles.meta}>
        {formatInsightTimelineScopeMeta({ months, country, department })}
      </p>
      {events.length === 0 ? (
        <p className={styles.meta}>{emptyMessage}</p>
      ) : (
        <ol className={styles.list}>
          {events.map((event) => (
            <li key={`${event.employeeId}-${event.effectiveDate}-${event.reason}`} className={styles.item}>
              <div>
                <p className={styles.name}>{event.fullName}</p>
                <p className={styles.meta}>
                  {event.employeeId} · {event.department} · {event.reason} · effective{" "}
                  {event.effectiveDate}
                </p>
              </div>
              <span className={styles.salary}>
                {formatSalary(event.baseSalary, event.currency)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
