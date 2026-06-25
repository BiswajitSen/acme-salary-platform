import type { AiInsightIntent } from "@acme/shared";

export const INSIGHT_INTENT_PATTERNS: ReadonlyArray<{
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
    intent: "MEDIAN_SPLIT_COUNTS",
    pattern:
      /\b(?:(?:how many|number of|count of)\s+employees?(?:\s+\w+){0,10}\s+(?:earn(?:ing)?|paid)\s+)?(?:below\s+and\s+above|above\s+and\s+below|below|above)\s+(?:the\s+)?median(?:\s+(?:salary|pay|compensation))?\b/,
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

export function detectInsightIntent(normalizedQuery: string): AiInsightIntent {
  for (const { intent, pattern } of INSIGHT_INTENT_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return intent;
    }
  }

  return "UNKNOWN";
}
