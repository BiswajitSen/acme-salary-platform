import {
  INSIGHT_QUERY_COUNTRIES,
  INSIGHT_QUERY_DEPARTMENTS,
  type InsightExecutionError,
  type ParsedInsightQuery,
} from "@acme/shared";

import {
  isAllowedInsightCountry,
  isAllowedInsightDepartment,
  looksLikeSqlInjection,
  parseSafeInsightCurrency,
} from "./safety.js";

const MAX_INSIGHT_JOB_TITLE_LENGTH = 100;

function isAllowedInsightJobTitle(jobTitle: string): boolean {
  const trimmed = jobTitle.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_INSIGHT_JOB_TITLE_LENGTH;
}

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

  if (
    parsedQuery.country != null &&
    !isAllowedInsightCountry(parsedQuery.country, INSIGHT_QUERY_COUNTRIES)
  ) {
    return {
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    };
  }

  if (parsedQuery.jobTitle !== null && !isAllowedInsightJobTitle(parsedQuery.jobTitle)) {
    return {
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    };
  }

  if (parsedQuery.limit !== null && (parsedQuery.limit < 1 || parsedQuery.limit > 25)) {
    return {
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    };
  }

  return null;
}
