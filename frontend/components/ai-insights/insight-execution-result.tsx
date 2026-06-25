import type { InsightExecutionResult } from "@acme/shared";

import { Card } from "@/components/ui/card";
import {
  formatInsightHeadcountScopeMeta,
  formatInsightPayrollScopeMeta,
  formatInsightSalaryScopeMeta,
} from "@/lib/format-insight-scope-meta";
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
            {formatInsightSalaryScopeMeta({ ...result, employeeCount: result.employeeCount })}
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
            {formatInsightSalaryScopeMeta({ ...result, employeeCount: result.employeeCount })}
          </p>
        </Card>
      );
    case "HEADCOUNT":
      return (
        <Card title="Headcount">
          <p className={styles.metric}>{result.headcount.toLocaleString()}</p>
          <p className={styles.meta}>{formatInsightHeadcountScopeMeta(result)}</p>
        </Card>
      );
    case "TOTAL_PAYROLL":
      return (
        <Card title="Total payroll">
          <p className={styles.metric}>
            {formatSalary(result.totalPayroll, result.currency)}
          </p>
          <p className={styles.meta}>{formatInsightPayrollScopeMeta(result)}</p>
        </Card>
      );
    case "TOP_EARNERS":
      return (
        <Card title="Top earners">
          <p className={styles.meta}>
            {result.country
              ? `Employees in ${result.country} · amounts in ${result.currency}`
              : `Organization-wide · amounts in ${result.currency}`}
          </p>
          {result.earners.length === 0 ? (
            <p className={styles.meta}>No earners found.</p>
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
    case "RECENT_PROMOTIONS":
      return (
        <Card title="Recent promotions">
          <p className={styles.meta}>
            Promotion records in the last {result.months} months
            {result.country ? ` · ${result.country}` : ""}
            {result.department ? ` · ${result.department}` : ""}
          </p>
          {result.promotions.length === 0 ? (
            <p className={styles.meta}>No promotions found in this period.</p>
          ) : (
            <ol className={styles.list}>
              {result.promotions.map((promotion) => (
                <li
                  key={`${promotion.employeeId}-${promotion.effectiveDate}`}
                  className={styles.item}
                >
                  <div>
                    <p className={styles.name}>{promotion.fullName}</p>
                    <p className={styles.meta}>
                      {promotion.employeeId} · {promotion.department} · effective{" "}
                      {promotion.effectiveDate}
                    </p>
                  </div>
                  <span className={styles.salary}>
                    {formatSalary(promotion.baseSalary, promotion.currency)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      );
  }
}
