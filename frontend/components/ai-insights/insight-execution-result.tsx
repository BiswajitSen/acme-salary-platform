"use client";

import type { InsightExecutionResult, TopEarner } from "@acme/shared";

import { Card } from "@/components/ui/card";
import {
  formatInsightBottomEarnersScopeMeta,
  formatInsightHeadcountScopeMeta,
  formatInsightNearMedianScopeMeta,
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

type RankedEarnersCardProps = {
  title: string;
  meta: string;
  emptyMessage: string;
  earners: TopEarner[];
  currency: string;
};

function RankedEarnersCard({
  title,
  meta,
  emptyMessage,
  earners,
  currency,
}: RankedEarnersCardProps) {
  return (
    <Card title={title}>
      <p className={styles.listHeader}>{meta}</p>
      {earners.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ol className={styles.list}>
          {earners.map((earner, index) => (
            <li key={earner.employeeId} className={styles.item}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.details}>
                <p className={styles.name}>{earner.fullName}</p>
                <p className={styles.itemMeta}>
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

export function InsightExecutionResult({ result }: InsightExecutionResultProps) {
  switch (result.intent) {
    case "AVG_DEPT_SALARY":
      return (
        <Card title="Average salary">
          <p className={styles.metric}>
            {formatSalary(result.averageSalary, result.currency)}
          </p>
          <p className={styles.scopeMeta}>
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
          <p className={styles.scopeMeta}>
            {formatInsightSalaryScopeMeta({ ...result, employeeCount: result.employeeCount })}
          </p>
        </Card>
      );
    case "HEADCOUNT":
      return (
        <Card title="Headcount">
          <p className={styles.metric}>{result.headcount.toLocaleString()}</p>
          <p className={styles.scopeMeta}>{formatInsightHeadcountScopeMeta(result)}</p>
        </Card>
      );
    case "TOTAL_PAYROLL":
      return (
        <Card title="Total payroll">
          <p className={styles.metric}>
            {formatSalary(result.totalPayroll, result.currency)}
          </p>
          <p className={styles.scopeMeta}>{formatInsightPayrollScopeMeta(result)}</p>
        </Card>
      );
    case "TOP_EARNERS":
      return (
        <RankedEarnersCard
          title="Top earners"
          meta={formatInsightTopEarnersScopeMeta(result)}
          emptyMessage="No earners found."
          earners={result.earners}
          currency={result.currency}
        />
      );
    case "BOTTOM_EARNERS":
      return (
        <RankedEarnersCard
          title="Bottom earners"
          meta={formatInsightBottomEarnersScopeMeta(result)}
          emptyMessage="No earners found."
          earners={result.earners}
          currency={result.currency}
        />
      );
    case "NEAR_MEDIAN_EARNERS":
      return (
        <RankedEarnersCard
          title="Near-median earners"
          meta={`${formatInsightNearMedianScopeMeta(result)} · median ${formatSalary(result.medianSalary, result.currency)}`}
          emptyMessage="No employees found within the median band."
          earners={result.earners}
          currency={result.currency}
        />
      );
    case "RECENT_PROMOTIONS":
      return (
        <InsightTimelineResultCard
          title="Recent promotions"
          emptyMessage="No promotions found in this period."
          months={result.months}
          sinceDate={result.sinceDate}
          country={result.country}
          department={result.department}
          jobTitle={result.jobTitle}
          events={result.promotions}
        />
      );
    case "RECENT_NEW_HIRES":
      return (
        <InsightTimelineResultCard
          title="Recent new hires"
          emptyMessage="No new hires found in this period."
          months={result.months}
          sinceDate={result.sinceDate}
          country={result.country}
          department={result.department}
          jobTitle={result.jobTitle}
          events={result.hires}
        />
      );
    case "RECENT_SALARY_INCREASES":
      return (
        <InsightTimelineResultCard
          title="Recent salary increases"
          emptyMessage="No salary increases found in this period."
          months={result.months}
          sinceDate={result.sinceDate}
          country={result.country}
          department={result.department}
          jobTitle={result.jobTitle}
          events={result.increases}
        />
      );
  }
}
