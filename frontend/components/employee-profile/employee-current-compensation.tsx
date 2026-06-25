import type { CurrentCompensation, ExchangeRatesToUsd } from "@acme/shared";

import { Card } from "@/components/ui/card";
import { formatDisplaySalary } from "@/lib/format-display-salary";
import { formatSalary } from "@/lib/format-salary";

import styles from "./employee-current-compensation.module.css";

type EmployeeCurrentCompensationProps = {
  currentCompensation: CurrentCompensation | null;
  displayCurrency: string;
  ratesToUsd: ExchangeRatesToUsd | null;
};

export function EmployeeCurrentCompensation({
  currentCompensation,
  displayCurrency,
  ratesToUsd,
}: EmployeeCurrentCompensationProps) {
  function formatAmount(amount: number, nativeCurrency: string): string {
    if (ratesToUsd === null) {
      return formatSalary(amount, nativeCurrency);
    }

    return formatDisplaySalary(amount, nativeCurrency, displayCurrency, ratesToUsd);
  }

  return (
    <Card title="Current compensation">
      {currentCompensation ? (
        <dl className={styles.metrics}>
          <div>
            <dt>Base salary</dt>
            <dd className={styles.highlight}>
              {formatAmount(
                currentCompensation.baseSalary,
                currentCompensation.currency,
              )}
            </dd>
          </div>
          <div>
            <dt>Effective date</dt>
            <dd>{currentCompensation.effectiveDate}</dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>{currentCompensation.reason}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{new Date(currentCompensation.lastUpdated).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt>Changed by</dt>
            <dd>{currentCompensation.changedBy}</dd>
          </div>
        </dl>
      ) : (
        <p className={styles.empty}>No compensation history recorded yet.</p>
      )}
    </Card>
  );
}
