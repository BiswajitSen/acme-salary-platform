"use client";

import { InsightExecutionResult } from "@/components/ai-insights/insight-execution-result";
import { ParsedInsightSummary } from "@/components/ai-insights/parsed-insight-summary";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMessage } from "@/components/ui/status-message";
import { useDisplayCurrency } from "@/lib/hooks/use-display-currency";
import { useInsightQueryParser } from "@/lib/hooks/use-insight-query-parser";
import { INSIGHT_EXAMPLE_QUERIES } from "@/lib/insight-example-queries";

import styles from "./insight-query-panel.module.css";

export function InsightQueryPanel() {
  const { currency } = useDisplayCurrency();
  const {
    query,
    response,
    isSubmitting,
    errorMessage,
    updateQuery,
    submitQuery,
    resetQuery,
  } = useInsightQueryParser(currency);

  return (
    <section className={styles.page}>
      <PageHeader
        title="AI Insights"
        subtitle="Ask salary analytics questions in plain English. Combine metrics with country, department, and timeline filters such as last 3 months."
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
            {INSIGHT_EXAMPLE_QUERIES.map((example) => (
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
        <ParsedInsightSummary
          parsedQuery={response.parsedQuery}
          executionCurrency={response.result?.currency}
        />
      )}

      {!isSubmitting && response?.error && (
        <Alert variant="error">{response.error.message}</Alert>
      )}

      {!isSubmitting && response?.result && (
        <>
          <p className={styles.fxNote}>FX rates as of {response.exchangeRatesAsOf}</p>
          <InsightExecutionResult result={response.result} />
        </>
      )}
    </section>
  );
}
