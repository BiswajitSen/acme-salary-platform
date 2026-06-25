import {
  DEFAULT_INSIGHT_TIMELINE_MONTHS,
  type AiInsightIntent,
  type CompensationReason,
  type ParsedInsightQuery,
} from "@acme/shared";

import { extractExplicitCompensationReason } from "./insight-query-compensation-reason.js";
import { resolveInsightTimelineWindow } from "./insight-query-timeline-window.js";

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

export function resolveTimelineReasons(
  intent: InsightTimelineIntent,
  normalizedQuery: string,
): readonly CompensationReason[] {
  const explicitReason = extractExplicitCompensationReason(normalizedQuery);
  if (explicitReason !== null) {
    return [explicitReason];
  }

  return INSIGHT_TIMELINE_INTENT_REASONS[intent];
}

export function resolveInsightTimelineMonths(
  intent: AiInsightIntent,
  normalizedQuery: string,
): number | null {
  if (!isInsightTimelineIntent(intent)) {
    return null;
  }

  const window = resolveInsightTimelineWindow(normalizedQuery, true);
  return window.months;
}

export function resolveParsedTimelineFields(
  intent: AiInsightIntent,
  normalizedQuery: string,
): Pick<ParsedInsightQuery, "months" | "sinceDate"> {
  const window = resolveInsightTimelineWindow(normalizedQuery, isInsightTimelineIntent(intent));
  return {
    months: window.months,
    sinceDate: window.sinceDate,
  };
}

export { DEFAULT_INSIGHT_TIMELINE_MONTHS };
