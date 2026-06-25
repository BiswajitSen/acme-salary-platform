import type { CompensationTimelineEntry, ExchangeRatesToUsd } from "@acme/shared";

import { Card } from "@/components/ui/card";
import { formatDisplaySalary } from "@/lib/format-display-salary";
import { formatSalary } from "@/lib/format-salary";

import styles from "./compensation-timeline.module.css";

type CompensationTimelineProps = {
  entries: CompensationTimelineEntry[];
  displayCurrency: string;
  ratesToUsd: ExchangeRatesToUsd | null;
};

export function CompensationTimeline({
  entries,
  displayCurrency,
  ratesToUsd,
}: CompensationTimelineProps) {
  function formatAmount(amount: number, nativeCurrency: string): string {
    if (ratesToUsd === null) {
      return formatSalary(amount, nativeCurrency);
    }

    return formatDisplaySalary(amount, nativeCurrency, displayCurrency, ratesToUsd);
  }

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
                      : formatAmount(
                          entry.previousSalary,
                          entry.previousCurrency ?? entry.currency,
                        )}
                  </td>
                  <td>{formatAmount(entry.baseSalary, entry.currency)}</td>
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
