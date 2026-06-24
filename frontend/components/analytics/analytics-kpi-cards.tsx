import { formatSalary } from "@/lib/format-salary";

import styles from "./analytics-kpi-cards.module.css";

type AnalyticsKpiCardsProps = {
  currency: string;
  headcount: number;
  totalPayroll: number;
};

export function AnalyticsKpiCards({
  currency,
  headcount,
  totalPayroll,
}: AnalyticsKpiCardsProps) {
  return (
    <div className={styles.grid}>
      <article className={styles.card}>
        <p className={styles.label}>Headcount</p>
        <p className={styles.value}>{headcount.toLocaleString()}</p>
        <p className={styles.hint}>Employees with latest {currency} compensation</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Total payroll</p>
        <p className={styles.value}>{formatSalary(totalPayroll, currency)}</p>
        <p className={styles.hint}>Sum of latest base salaries in {currency}</p>
      </article>
    </div>
  );
}
