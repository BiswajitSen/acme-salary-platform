"use client";

import type { ParsedInsightQuery } from "@acme/shared";
import { useState } from "react";

import { parseInsightQuery } from "@/lib/api/ai-insights";

type InsightQueryParserState = {
  query: string;
  parsedQuery: ParsedInsightQuery | null;
  isParsing: boolean;
  errorMessage: string | null;
  updateQuery: (query: string) => void;
  submitQuery: () => Promise<void>;
  resetQuery: () => void;
};

const PARSE_ERROR_MESSAGE = "Unable to parse the insight query.";

export function useInsightQueryParser(): InsightQueryParserState {
  const [query, setQuery] = useState("");
  const [parsedQuery, setParsedQuery] = useState<ParsedInsightQuery | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
  }

  async function submitQuery() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setErrorMessage("Enter a question about salary analytics.");
      setParsedQuery(null);
      return;
    }

    setIsParsing(true);
    setErrorMessage(null);

    try {
      const nextParsedQuery = await parseInsightQuery(trimmedQuery);
      setParsedQuery(nextParsedQuery);
    } catch {
      setParsedQuery(null);
      setErrorMessage(PARSE_ERROR_MESSAGE);
    } finally {
      setIsParsing(false);
    }
  }

  function resetQuery() {
    setQuery("");
    setParsedQuery(null);
    setErrorMessage(null);
  }

  return {
    query,
    parsedQuery,
    isParsing,
    errorMessage,
    updateQuery,
    submitQuery,
    resetQuery,
  };
}
