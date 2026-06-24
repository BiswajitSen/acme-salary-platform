"use client";

import { ParsedInsightSummary } from "@/components/ai-insights/parsed-insight-summary";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMessage } from "@/components/ui/status-message";
import { useInsightQueryParser } from "@/lib/hooks/use-insight-query-parser";

import styles from "./insight-query-panel.module.css";

const EXAMPLE_QUERIES = [
  "What is the average salary in Engineering?",
  "total payroll in USD",
  "Who are the top earners in INR?",
] as const;

export function InsightQueryPanel() {
  const {
    query,
    parsedQuery,
    isParsing,
    errorMessage,
    updateQuery,
    submitQuery,
    resetQuery,
  } = useInsightQueryParser();

  return (
    <section className={styles.page}>
      <PageHeader
        title="AI Insights"
        subtitle="Ask salary analytics questions in plain English. The parser maps each query to a safe intent."
      />

      <Card title="Ask a question">
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void submitQuery();
          }}
        >
          <label className={styles.label} htmlFor="insight-query">
            Natural language query
          </label>
          <textarea
            id="insight-query"
            className={styles.textarea}
            value={query}
            placeholder="e.g. What is the average salary in Engineering?"
            rows={4}
            onChange={(event) => updateQuery(event.target.value)}
          />

          <div className={styles.examples}>
            <span>Try:</span>
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                className={styles.exampleButton}
                onClick={() => updateQuery(example)}
              >
                {example}
              </button>
            ))}
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={isParsing}>
              Parse query
            </Button>
            <Button type="button" onClick={resetQuery} disabled={isParsing}>
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {isParsing && <StatusMessage isLoading message="Parsing query…" />}

      {!isParsing && parsedQuery && <ParsedInsightSummary parsedQuery={parsedQuery} />}
    </section>
  );
}
