import {
  DEFAULT_INSIGHT_TIMELINE_MONTHS,
  type AiInsightIntent,
  type CompensationReason,
} from "@acme/shared";

export const INSIGHT_TIMELINE_INTENTS = [
  "RECENT_PROMOTIONS",
  "RECENT_NEW_HIRES",
  "RECENT_SALARY_INCREASES",
] as const;

export type InsightTimelineIntent = (typeof INSIGHT_TIMELINE_INTENTS)[number];

export const INSIGHT_TIMELINE_INTENT_REASONS: Record<
  InsightTimelineIntent,
  readonly CompensationReason[]
> = {
  RECENT_PROMOTIONS: ["Promotion"],
  RECENT_NEW_HIRES: ["New Hire"],
  RECENT_SALARY_INCREASES: ["Annual Increment", "Market Adjustment"],
};

export function isInsightTimelineIntent(
  intent: AiInsightIntent,
): intent is InsightTimelineIntent {
  return (INSIGHT_TIMELINE_INTENTS as readonly string[]).includes(intent);
}

export function extractInsightTimelineMonths(normalizedQuery: string): number | null {
  const explicitMatch = normalizedQuery.match(
    /\b(?:last|past|in the last|within the last|after)\s+(\d+)\s*months?\b/,
  );

  if (explicitMatch) {
    return Number.parseInt(explicitMatch[1]!, 10);
  }

  return null;
}

export function resolveInsightTimelineMonths(
  intent: AiInsightIntent,
  normalizedQuery: string,
): number | null {
  if (!isInsightTimelineIntent(intent)) {
    return null;
  }

  return extractInsightTimelineMonths(normalizedQuery) ?? DEFAULT_INSIGHT_TIMELINE_MONTHS;
}
