import type { InsightExecutionResult } from "@acme/shared";

import { Card } from "@/components/ui/card";
import { formatSalary } from "@/lib/format-salary";

import styles from "./insight-execution-result.module.css";

type InsightExecutionResultProps = {
  result: InsightExecutionResult;
};

export function InsightExecutionResult({ result }: InsightExecutionResultProps) {
  switch (result.intent) {
    case "AVG_DEPT_SALARY":
      return (
        <Card title="Average salary">
          <p className={styles.metric}>
            {formatSalary(result.averageSalary, result.currency)}
          </p>
          <p className={styles.meta}>
            {result.department} · {result.employeeCount} employees · {result.currency}
          </p>
        </Card>
      );
    case "MEDIAN_DEPT_SALARY":
      return (
        <Card title="Median salary">
          <p className={styles.metric}>
            {formatSalary(result.medianSalary, result.currency)}
          </p>
          <p className={styles.meta}>
            {result.department} · {result.employeeCount} employees · {result.currency}
          </p>
        </Card>
      );
    case "HEADCOUNT":
      return (
        <Card title="Headcount">
          <p className={styles.metric}>{result.headcount.toLocaleString()}</p>
          <p className={styles.meta}>Employees with latest compensation in {result.currency}</p>
        </Card>
      );
    case "TOTAL_PAYROLL":
      return (
        <Card title="Total payroll">
          <p className={styles.metric}>
            {formatSalary(result.totalPayroll, result.currency)}
          </p>
          <p className={styles.meta}>Latest compensation total in {result.currency}</p>
        </Card>
      );
    case "TOP_EARNERS":
      return (
        <Card title="Top earners">
          {result.earners.length === 0 ? (
            <p className={styles.meta}>No earners found for {result.currency}.</p>
          ) : (
            <ol className={styles.list}>
              {result.earners.map((earner, index) => (
                <li key={earner.employeeId} className={styles.item}>
                  <span className={styles.rank}>{index + 1}</span>
                  <div>
                    <p className={styles.name}>{earner.fullName}</p>
                    <p className={styles.meta}>
                      {earner.employeeId} · {earner.department}
                    </p>
                  </div>
                  <span className={styles.salary}>
                    {formatSalary(earner.baseSalary, result.currency)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      );
  }
}
