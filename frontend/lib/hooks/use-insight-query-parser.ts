"use client";

import type { ExecuteInsightQueryResponse } from "@acme/shared";
import { useEffect, useRef, useState } from "react";

import { executeInsightQuery } from "@/lib/api/ai-insights";

type InsightQueryParserState = {
  query: string;
  response: ExecuteInsightQueryResponse | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  updateQuery: (query: string) => void;
  submitQuery: () => Promise<void>;
  resetQuery: () => void;
};

const EXECUTE_ERROR_MESSAGE = "Unable to run the insight query.";

export function useInsightQueryParser(displayCurrency: string): InsightQueryParserState {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<ExecuteInsightQueryResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const executedQueryRef = useRef<string | null>(null);
  const isInitialCurrencyRef = useRef(true);

  useEffect(() => {
    if (isInitialCurrencyRef.current) {
      isInitialCurrencyRef.current = false;
      return;
    }

    const trimmedQuery = executedQueryRef.current;

    if (!trimmedQuery) {
      return;
    }

    const queryToRun = trimmedQuery;
    let isCancelled = false;

    async function rerunQuery() {
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const nextResponse = await executeInsightQuery(queryToRun, displayCurrency);

        if (!isCancelled) {
          setResponse(nextResponse);
        }
      } catch {
        if (!isCancelled) {
          setResponse(null);
          setErrorMessage(EXECUTE_ERROR_MESSAGE);
        }
      } finally {
        if (!isCancelled) {
          setIsSubmitting(false);
        }
      }
    }

    void rerunQuery();

    return () => {
      isCancelled = true;
    };
  }, [displayCurrency]);

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
  }

  async function submitQuery() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setErrorMessage("Enter a question about salary analytics.");
      setResponse(null);
      executedQueryRef.current = null;
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const nextResponse = await executeInsightQuery(trimmedQuery, displayCurrency);
      executedQueryRef.current = trimmedQuery;
      setResponse(nextResponse);
    } catch {
      executedQueryRef.current = null;
      setResponse(null);
      setErrorMessage(EXECUTE_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetQuery() {
    setQuery("");
    setResponse(null);
    setErrorMessage(null);
    executedQueryRef.current = null;
  }

  return {
    query,
    response,
    isSubmitting,
    errorMessage,
    updateQuery,
    submitQuery,
    resetQuery,
  };
}
