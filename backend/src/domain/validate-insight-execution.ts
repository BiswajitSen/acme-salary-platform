import {
  INSIGHT_QUERY_DEPARTMENTS,
  type InsightExecutionError,
  type ParsedInsightQuery,
} from "@acme/shared";

import {
  isAllowedInsightDepartment,
  looksLikeSqlInjection,
  parseSafeInsightCurrency,
} from "./insight-query-safety.js";

export function validateInsightExecutionSafety(
  parsedQuery: ParsedInsightQuery,
): InsightExecutionError | null {
  const normalizedQuery = parsedQuery.originalQuery.trim().toLowerCase();

  if (looksLikeSqlInjection(normalizedQuery)) {
    return {
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    };
  }

  if (
    parsedQuery.department !== null &&
    !isAllowedInsightDepartment(parsedQuery.department, INSIGHT_QUERY_DEPARTMENTS)
  ) {
    return {
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    };
  }

  if (parsedQuery.currency !== null && parseSafeInsightCurrency(parsedQuery.currency) === null) {
    return {
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    };
  }

  return null;
}
