import {
  DEFAULT_INSIGHT_TIMELINE_MONTHS,
  INSIGHT_QUERY_DEPARTMENTS,
  type AiInsightIntent,
  type ParsedInsightQuery,
} from "@acme/shared";

import { looksLikeSqlInjection } from "./insight-query-safety.js";
import { extractInsightCountry } from "./insight-query-country-aliases.js";
import { resolveInsightTimelineMonths } from "./insight-query-timeline.js";

const ISO_CURRENCY_PATTERN = /\b(USD|GBP|EUR|INR|SGD)\b/i;

const INTENT_PATTERNS: ReadonlyArray<{
  intent: Exclude<AiInsightIntent, "UNKNOWN">;
  pattern: RegExp;
}> = [
  {
    intent: "RECENT_SALARY_INCREASES",
    pattern:
      /\b(?:salary\s+(?:hike|hikes|increase|increases|raise|raises)|(?:got|received)\s+(?:a\s+)?(?:salary\s+)?(?:hike|raise|increment|increments?)|annual\s+increments?)\b/,
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
  { intent: "MEDIAN_DEPT_SALARY", pattern: /\bmedian\s+(?:salary|pay|compensation)\b/ },
  {
    intent: "AVG_DEPT_SALARY",
    pattern: /\b(?:average|avg|mean)\s+(?:salary|pay|compensation)\b/,
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

const DEPARTMENT_ALIASES: Record<string, (typeof INSIGHT_QUERY_DEPARTMENTS)[number]> = {
  engineers: "Engineering",
  engineer: "Engineering",
};

function extractInsightDepartment(normalizedQuery: string): string | null {
  for (const department of INSIGHT_QUERY_DEPARTMENTS) {
    const pattern = new RegExp(`\\b${department}\\b`, "i");
    if (pattern.test(normalizedQuery)) {
      return department;
    }
  }

  for (const [alias, department] of Object.entries(DEPARTMENT_ALIASES)) {
    const pattern = new RegExp(`\\b${alias}\\b`, "i");
    if (pattern.test(normalizedQuery)) {
      return department;
    }
  }

  return null;
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
    currency: null,
    months: null,
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
  const department = extractInsightDepartment(normalizedQuery);
  const months = resolveInsightTimelineMonths(intent, normalizedQuery);

  if (intent === "UNKNOWN") {
    return buildUnknownInsightQuery(originalQuery);
  }

  return {
    intent,
    originalQuery,
    department,
    country,
    currency,
    months,
  };
}
