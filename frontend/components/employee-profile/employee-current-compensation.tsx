import type { CurrentCompensation } from "@acme/shared";

import { Card } from "@/components/ui/card";

import styles from "./employee-current-compensation.module.css";

type EmployeeCurrentCompensationProps = {
  currentCompensation: CurrentCompensation | null;
};

function formatSalary(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function EmployeeCurrentCompensation({
  currentCompensation,
}: EmployeeCurrentCompensationProps) {
  return (
    <Card title="Current compensation">
      {currentCompensation ? (
        <dl className={styles.metrics}>
          <div>
            <dt>Base salary</dt>
            <dd className={styles.highlight}>
              {formatSalary(
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
