import type { ParsedInsightQuery } from "@acme/shared";

import { Card } from "@/components/ui/card";

import styles from "./parsed-insight-summary.module.css";

type ParsedInsightSummaryProps = {
  parsedQuery: ParsedInsightQuery;
  executionCurrency?: string | null;
};

function formatIntentLabel(intent: ParsedInsightQuery["intent"]): string {
  return intent.replaceAll("_", " ");
}

function formatFieldValue(value: string | number | null): string {
  if (value === null) {
    return "—";
  }

  return String(value);
}

function valueClassName(value: string | number | null): string {
  return value === null ? styles.valueEmpty : styles.valueSet;
}

export function ParsedInsightSummary({
  parsedQuery,
  executionCurrency = null,
}: ParsedInsightSummaryProps) {
  const resolvedCurrency = executionCurrency ?? parsedQuery.currency ?? "USD";

  return (
    <Card title="Detected intent">
      <div className={styles.header}>
        <span className={styles.intentBadge}>{formatIntentLabel(parsedQuery.intent)}</span>
        <p className={styles.queryPreview}>{parsedQuery.originalQuery}</p>
      </div>
      <dl className={styles.grid}>
        <div>
          <dt>Department</dt>
          <dd className={valueClassName(parsedQuery.department)}>
            {formatFieldValue(parsedQuery.department)}
          </dd>
        </div>
        <div>
          <dt>Country</dt>
          <dd className={valueClassName(parsedQuery.country)}>
            {formatFieldValue(parsedQuery.country)}
          </dd>
        </div>
        <div>
          <dt>Job title</dt>
          <dd className={valueClassName(parsedQuery.jobTitle)}>
            {formatFieldValue(parsedQuery.jobTitle)}
          </dd>
        </div>
        <div>
          <dt>Months</dt>
          <dd className={valueClassName(parsedQuery.months)}>
            {formatFieldValue(parsedQuery.months)}
          </dd>
        </div>
        <div>
          <dt>Since date</dt>
          <dd className={valueClassName(parsedQuery.sinceDate)}>
            {formatFieldValue(parsedQuery.sinceDate)}
          </dd>
        </div>
        <div>
          <dt>Limit</dt>
          <dd className={valueClassName(parsedQuery.limit)}>
            {formatFieldValue(parsedQuery.limit)}
          </dd>
        </div>
        <div>
          <dt>Median split</dt>
          <dd className={valueClassName(parsedQuery.medianSplitFocus)}>
            {formatFieldValue(parsedQuery.medianSplitFocus)}
          </dd>
        </div>
        <div>
          <dt>Display currency</dt>
          <dd className={styles.valueSet}>{resolvedCurrency}</dd>
        </div>
      </dl>
    </Card>
  );
}
