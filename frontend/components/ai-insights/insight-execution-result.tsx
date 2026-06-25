"use client";

import type { InsightExecutionResult } from "@acme/shared";

import { Card } from "@/components/ui/card";
import {
  formatInsightHeadcountScopeMeta,
  formatInsightPayrollScopeMeta,
  formatInsightSalaryScopeMeta,
  formatInsightTopEarnersScopeMeta,
} from "@/lib/format-insight-scope-meta";
import { formatSalary } from "@/lib/format-salary";

import { InsightTimelineResultCard } from "./insight-timeline-result-card";
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
            {formatInsightTopEarnersScopeMeta(result)}
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
        <InsightTimelineResultCard
          title="Recent promotions"
          emptyMessage="No promotions found in this period."
          months={result.months}
          country={result.country}
          department={result.department}
          events={result.promotions}
        />
      );
    case "RECENT_NEW_HIRES":
      return (
        <InsightTimelineResultCard
          title="Recent new hires"
          emptyMessage="No new hires found in this period."
          months={result.months}
          country={result.country}
          department={result.department}
          events={result.hires}
        />
      );
    case "RECENT_SALARY_INCREASES":
      return (
        <InsightTimelineResultCard
          title="Recent salary increases"
          emptyMessage="No salary increases found in this period."
          months={result.months}
          country={result.country}
          department={result.department}
          events={result.increases}
        />
      );
  }
}
