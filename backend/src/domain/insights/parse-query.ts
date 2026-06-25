import type { ParsedInsightQuery } from "@acme/shared";

import { extractInsightBottomLimit, extractInsightTopLimit } from "./filters/ranked-limits.js";
import { extractInsightCountry } from "./filters/country.js";
import { extractInsightDepartment } from "./filters/department.js";
import {
  JOINED_AS_PATTERN,
  extractJoinedAsScope,
  extractInsightJobTitle,
} from "./filters/job-title.js";
import { detectInsightIntent } from "./intent-patterns.js";
import { looksLikeSqlInjection } from "./safety.js";
import { resolveParsedTimelineFields } from "./timeline/timeline.js";

const ISO_CURRENCY_PATTERN = /\b(USD|GBP|EUR|INR|SGD)\b/i;

function normalizeInsightQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function extractInsightCurrency(normalizedQuery: string): string | null {
  const isoMatch = normalizedQuery.match(ISO_CURRENCY_PATTERN);
  return isoMatch ? isoMatch[1]!.toUpperCase() : null;
}

function buildUnknownInsightQuery(originalQuery: string): ParsedInsightQuery {
  return {
    intent: "UNKNOWN",
    originalQuery,
    department: null,
    country: null,
    jobTitle: null,
    currency: null,
    months: null,
    sinceDate: null,
    limit: null,
  };
}

function extractRankedLimit(
  intent: ParsedInsightQuery["intent"],
  normalizedQuery: string,
): number | null {
  if (intent === "TOP_EARNERS") {
    return extractInsightTopLimit(normalizedQuery);
  }

  if (intent === "BOTTOM_EARNERS") {
    return extractInsightBottomLimit(normalizedQuery);
  }

  return null;
}

export function parseInsightQuery(query: string): ParsedInsightQuery {
  const originalQuery = normalizeInsightQuery(query);
  const normalizedQuery = originalQuery.toLowerCase();

  if (looksLikeSqlInjection(normalizedQuery)) {
    return buildUnknownInsightQuery(originalQuery);
  }

  const intent = detectInsightIntent(normalizedQuery);
  const currency = extractInsightCurrency(normalizedQuery);
  const country = extractInsightCountry(normalizedQuery);
  const joinedAsScope = extractJoinedAsScope(originalQuery, normalizedQuery);
  const queryForDepartment =
    joinedAsScope.jobTitle === null
      ? normalizedQuery
      : normalizedQuery.replace(JOINED_AS_PATTERN, " ");
  const department =
    joinedAsScope.department ?? extractInsightDepartment(queryForDepartment);
  const jobTitle =
    joinedAsScope.jobTitle ?? extractInsightJobTitle(originalQuery, normalizedQuery);
  const timeline = resolveParsedTimelineFields(intent, normalizedQuery);
  const limit = extractRankedLimit(intent, normalizedQuery);

  if (intent === "UNKNOWN") {
    return buildUnknownInsightQuery(originalQuery);
  }

  return {
    intent,
    originalQuery,
    department,
    country,
    jobTitle,
    currency,
    months: timeline.months,
    sinceDate: timeline.sinceDate,
    limit,
  };
}
