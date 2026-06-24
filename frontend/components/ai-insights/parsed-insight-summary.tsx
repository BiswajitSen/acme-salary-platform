import type { ParsedInsightQuery } from "@acme/shared";

import { Card } from "@/components/ui/card";

import styles from "./parsed-insight-summary.module.css";

type ParsedInsightSummaryProps = {
  parsedQuery: ParsedInsightQuery;
};

function formatIntentLabel(intent: ParsedInsightQuery["intent"]): string {
  return intent.replaceAll("_", " ");
}

export function ParsedInsightSummary({ parsedQuery }: ParsedInsightSummaryProps) {
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
          <dt>Currency</dt>
          <dd>{parsedQuery.currency ?? "—"}</dd>
        </div>
        <div>
          <dt>Original query</dt>
          <dd>{parsedQuery.originalQuery}</dd>
        </div>
      </dl>
    </Card>
  );
}
