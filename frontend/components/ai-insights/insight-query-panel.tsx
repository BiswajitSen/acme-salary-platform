"use client";

import { InsightExecutionResult } from "@/components/ai-insights/insight-execution-result";
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
    response,
    isSubmitting,
    errorMessage,
    updateQuery,
    submitQuery,
    resetQuery,
  } = useInsightQueryParser();

  return (
    <section className={styles.page}>
      <PageHeader
        title="AI Insights"
        subtitle="Ask salary analytics questions in plain English. Each query runs through a safe, whitelisted executor."
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
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Run query
            </Button>
            <Button type="button" onClick={resetQuery} disabled={isSubmitting}>
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {isSubmitting && <StatusMessage isLoading message="Running query…" />}

      {!isSubmitting && response?.parsedQuery && (
        <ParsedInsightSummary parsedQuery={response.parsedQuery} />
      )}

      {!isSubmitting && response?.error && (
        <Alert variant="error">{response.error.message}</Alert>
      )}

      {!isSubmitting && response?.result && (
        <InsightExecutionResult result={response.result} />
      )}
    </section>
  );
}
