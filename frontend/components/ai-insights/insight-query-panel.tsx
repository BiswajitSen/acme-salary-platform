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
import { useMobileLayout } from "@/lib/hooks/use-mobile-layout";
import { getInsightResultCurrency } from "@/lib/insight-result-currency";
import { INSIGHT_EXAMPLE_QUERIES } from "@/lib/insight-example-queries";

import styles from "./insight-query-panel.module.css";

export function InsightQueryPanel() {
  const isMobileLayout = useMobileLayout();
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

  const showMobileInlineResponse =
    isMobileLayout &&
    !isSubmitting &&
    response !== null &&
    (response.result !== null || response.error !== null);

  return (
    <section className={styles.page}>
      <PageHeader
        title="Insights"
        subtitle="Ask compensation questions in plain English. A rule-based parser maps your query to whitelisted analytics — no AI or dynamic SQL."
      />

      <Card title="Ask a question">
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void submitQuery();
          }}
        >
          <div className={styles.queryHeader}>
            <label className={styles.label} htmlFor="insight-query">
              Natural language query
            </label>
          </div>
          <textarea
            id="insight-query"
            className={styles.textarea}
            value={query}
            placeholder="e.g. What is the average salary in Engineering?"
            rows={4}
            onChange={(event) => updateQuery(event.target.value)}
          />

          {showMobileInlineResponse ? (
            <div className={styles.mobileResultPanel}>
              <div className={styles.mobileResultHeader}>
                <span className={styles.mobileResultTitle}>Result</span>
                <button
                  type="button"
                  className={styles.mobileCloseButton}
                  onClick={resetQuery}
                  aria-label="Close result"
                >
                  Close
                </button>
              </div>

              {response.result && (
                <div className={styles.mobileResultBody}>
                  <p className={styles.fxNote}>FX rates as of {response.exchangeRatesAsOf}</p>
                  <InsightExecutionResult result={response.result} />
                </div>
              )}

              {response.error && <Alert variant="error">{response.error.message}</Alert>}
            </div>
          ) : (
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
          )}

          <div className={styles.formFooter}>
            <div className={styles.submitSlot}>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Run query
              </Button>
            </div>
            <div className={styles.actions}>
              <Button type="button" onClick={resetQuery} disabled={isSubmitting}>
                Clear
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {isSubmitting && <StatusMessage isLoading message="Running query…" />}

      {!isSubmitting &&
        (response?.parsedQuery || response?.error || response?.result) && (
          <div className={styles.responseStack}>
            {response.parsedQuery && (
              <div className={styles.parsedSummary}>
                <ParsedInsightSummary
                  parsedQuery={response.parsedQuery}
                  executionCurrency={getInsightResultCurrency(response.result) ?? currency}
                />
              </div>
            )}

            {response.result && !showMobileInlineResponse && (
              <div className={styles.results}>
                <p className={styles.fxNote}>FX rates as of {response.exchangeRatesAsOf}</p>
                <InsightExecutionResult result={response.result} />
              </div>
            )}

            {response.error && !showMobileInlineResponse && (
              <div className={styles.responseError}>
                <Alert variant="error">{response.error.message}</Alert>
              </div>
            )}
          </div>
        )}
    </section>
  );
}
