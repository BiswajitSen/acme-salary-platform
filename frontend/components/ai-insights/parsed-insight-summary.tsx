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

export function ParsedInsightSummary({
  parsedQuery,
  executionCurrency = null,
}: ParsedInsightSummaryProps) {
  const resolvedCurrency = executionCurrency ?? parsedQuery.currency ?? "USD";

  return (
    <Card title="Detected intent">
      <dl className={styles.grid}>
        <div>
          <dt>Intent</dt>
          <dd>{formatIntentLabel(parsedQuery.intent)}</dd>
        </div>
        <div>
          <dt>Department</dt>
          <dd>{parsedQuery.department ?? "—"}</dd>
        </div>
        <div>
          <dt>Country</dt>
          <dd>{parsedQuery.country ?? "—"}</dd>
        </div>
        <div>
          <dt>Job title</dt>
          <dd>{parsedQuery.jobTitle ?? "—"}</dd>
        </div>
        <div>
          <dt>Months</dt>
          <dd>{parsedQuery.months ?? "—"}</dd>
        </div>
        <div>
          <dt>Since date</dt>
          <dd>{parsedQuery.sinceDate ?? "—"}</dd>
        </div>
        <div>
          <dt>Limit</dt>
          <dd>{parsedQuery.limit ?? "—"}</dd>
        </div>
        <div>
          <dt>Display currency</dt>
          <dd>{resolvedCurrency}</dd>
        </div>
        <div>
          <dt>Original query</dt>
          <dd>{parsedQuery.originalQuery}</dd>
        </div>
      </dl>
    </Card>
  );
}
