import {
  DEFAULT_RECENT_PROMOTIONS_MONTHS,
  INSIGHT_QUERY_DEPARTMENTS,
  type AiInsightIntent,
  type ParsedInsightQuery,
} from "@acme/shared";

import { looksLikeSqlInjection } from "./insight-query-safety.js";
import { extractInsightCountry } from "./insight-query-country-aliases.js";

const ISO_CURRENCY_PATTERN = /\b(USD|GBP|EUR|INR|SGD)\b/i;

const INTENT_PATTERNS: ReadonlyArray<{
  intent: Exclude<AiInsightIntent, "UNKNOWN">;
  pattern: RegExp;
}> = [
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

function extractInsightDepartment(normalizedQuery: string): string | null {
  for (const department of INSIGHT_QUERY_DEPARTMENTS) {
    const pattern = new RegExp(`\\b${department}\\b`, "i");
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

function extractInsightMonths(normalizedQuery: string): number | null {
  const explicitMatch = normalizedQuery.match(
    /\b(?:last|past|in the last|within the last)\s+(\d+)\s*months?\b/,
  );

  if (explicitMatch) {
    return Number.parseInt(explicitMatch[1]!, 10);
  }

  return null;
}

function resolveInsightMonths(intent: AiInsightIntent, normalizedQuery: string): number | null {
  if (intent !== "RECENT_PROMOTIONS") {
    return null;
  }

  return extractInsightMonths(normalizedQuery) ?? DEFAULT_RECENT_PROMOTIONS_MONTHS;
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

function salaryIntentRequiresEmployeeScope(intent: AiInsightIntent): boolean {
  return intent === "AVG_DEPT_SALARY" || intent === "MEDIAN_DEPT_SALARY";
}

function hasEmployeeScope(department: string | null, country: string | null): boolean {
  return department !== null || country !== null;
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
  const months = resolveInsightMonths(intent, normalizedQuery);

  if (intent === "UNKNOWN") {
    return buildUnknownInsightQuery(originalQuery);
  }

  if (salaryIntentRequiresEmployeeScope(intent) && !hasEmployeeScope(department, country)) {
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
