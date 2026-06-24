"use client";

import type { ExecuteInsightQueryResponse } from "@acme/shared";
import { useState } from "react";

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

export function useInsightQueryParser(): InsightQueryParserState {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<ExecuteInsightQueryResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
  }

  async function submitQuery() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setErrorMessage("Enter a question about salary analytics.");
      setResponse(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const nextResponse = await executeInsightQuery(trimmedQuery);
      setResponse(nextResponse);
    } catch {
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
