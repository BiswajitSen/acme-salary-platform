import type { CompensationTimelineEntry } from "@acme/shared";

import { Card } from "@/components/ui/card";

import styles from "./compensation-timeline.module.css";

type CompensationTimelineProps = {
  entries: CompensationTimelineEntry[];
};

function formatSalary(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CompensationTimeline({ entries }: CompensationTimelineProps) {
  return (
    <Card title="Compensation timeline">
      {entries.length === 0 ? (
        <p className={styles.empty}>No compensation changes recorded yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Effective date</th>
                <th scope="col">Previous</th>
                <th scope="col">New salary</th>
                <th scope="col">Reason</th>
                <th scope="col">Changed by</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.effectiveDate}</td>
                  <td>
                    {entry.previousSalary === null
                      ? "—"
                      : formatSalary(entry.previousSalary, entry.currency)}
                  </td>
                  <td>{formatSalary(entry.baseSalary, entry.currency)}</td>
                  <td>{entry.reason}</td>
                  <td>{entry.changedBy}</td>
                  <td>{entry.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
