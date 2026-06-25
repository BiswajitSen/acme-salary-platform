import {
  INSIGHT_QUERY_DEPARTMENTS,
  type AiInsightIntent,
  type ParsedInsightQuery,
} from "@acme/shared";

import { looksLikeSqlInjection } from "./insight-query-safety.js";
import { extractInsightCountry } from "./insight-query-country-aliases.js";
import { extractInsightDepartment } from "./insight-query-department-aliases.js";
import { JOINED_AS_PATTERN, extractJoinedAsScope, extractInsightJobTitle } from "./insight-query-job-title.js";
import { resolveParsedTimelineFields } from "./insight-query-timeline.js";
import { extractInsightBottomEarnersLimit, extractInsightTopEarnersLimit } from "./insight-query-ranked-earners.js";

const ISO_CURRENCY_PATTERN = /\b(USD|GBP|EUR|INR|SGD)\b/i;

const INTENT_PATTERNS: ReadonlyArray<{
  intent: Exclude<AiInsightIntent, "UNKNOWN">;
  pattern: RegExp;
}> = [
  {
    intent: "RECENT_SALARY_INCREASES",
    pattern:
      /\b(?:salary\s+(?:hike|hikes|increase|increases|raise|raises)|(?:got|received)\s+(?:a\s+)?(?:salary\s+)?(?:hike|raise|increment|increments?)|annual\s+increments?|market\s+adjustments?)\b/,
  },
  {
    intent: "RECENT_NEW_HIRES",
    pattern:
      /\b(?:new\s+(?:joiners?|hires?)|(?:employees?\s+)?who\s+joined|employees?\s+who\s+joined|joined\s+as)\b/,
  },
  {
    intent: "RECENT_PROMOTIONS",
    pattern: /\b(?:promotion|promoted|promotions)\b/,
  },
  {
    intent: "NEAR_MEDIAN_EARNERS",
    pattern:
      /\b(?:(?:who\s+)?(?:earn|earning|earns|paid)\s+(?:around|near|close to)|(?:around|near|close to))\s+(?:the\s+)?median(?:\s+(?:salary|pay|compensation))?\b/,
  },
  { intent: "MEDIAN_DEPT_SALARY", pattern: /\bmedian\s+(?:salary|pay|compensation)\b/ },
  {
    intent: "AVG_DEPT_SALARY",
    pattern: /\b(?:average|avg|mean)\s+(?:salary|pay|compensation)\b/,
  },
  {
    intent: "BOTTOM_EARNERS",
    pattern:
      /\b(?:(?:bottom|least|lowest)\s+(?:\d+\s+)?earners?|(?:least|lowest)\s+paid(?:\s+employees?)?)\b/,
  },
  {
    intent: "TOP_EARNERS",
    pattern: /\b(?:top\s+(?:\d+\s+)?earners|highest\s+(?:paid|earners))\b/,
  },
  {
    intent: "TOTAL_PAYROLL",
    pattern: /\b(?:total\s+payroll|payroll\s+(?:cost|spend))\b/,
  },
  {
    intent: "HEADCOUNT",
    pattern: /\b(?:headcount|how many employees|total employees|number of employees)\b/,
  },
];

function normalizeInsightQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function extractInsightCurrency(normalizedQuery: string): string | null {
  const isoMatch = normalizedQuery.match(ISO_CURRENCY_PATTERN);
  return isoMatch ? isoMatch[1]!.toUpperCase() : null;
}

function detectInsightIntent(normalizedQuery: string): AiInsightIntent {
  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return intent;
    }
  }

  return "UNKNOWN";
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
  const limit =
    intent === "TOP_EARNERS"
      ? extractInsightTopEarnersLimit(normalizedQuery)
      : intent === "BOTTOM_EARNERS"
        ? extractInsightBottomEarnersLimit(normalizedQuery)
        : null;

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
