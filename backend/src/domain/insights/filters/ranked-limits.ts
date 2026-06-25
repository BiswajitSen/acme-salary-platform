import { ANALYTICS_TOP_EARNERS_LIMIT } from "@acme/shared";

const MAX_RANKED_EARNERS_LIMIT = 25;

function parseRankedLimit(match: RegExpMatchArray | null): number | null {
  if (!match?.[1]) {
    return null;
  }

  const limit = Number.parseInt(match[1]!, 10);
  if (!Number.isFinite(limit) || limit <= 0) {
    return null;
  }

  return Math.min(limit, MAX_RANKED_EARNERS_LIMIT);
}

export function extractInsightTopLimit(normalizedQuery: string): number | null {
  return parseRankedLimit(normalizedQuery.match(/\btop\s+(\d+)\s+earners?\b/i));
}

export function extractInsightBottomLimit(normalizedQuery: string): number | null {
  return parseRankedLimit(
    normalizedQuery.match(/\b(?:bottom|least|lowest)\s+(\d+)\s+earners?\b/i),
  );
}

/** @deprecated Use extractInsightTopLimit */
export const extractInsightTopEarnersLimit = extractInsightTopLimit;

/** @deprecated Use extractInsightBottomLimit */
export const extractInsightBottomEarnersLimit = extractInsightBottomLimit;

export function resolveInsightTopLimit(normalizedQuery: string): number {
  return extractInsightTopLimit(normalizedQuery) ?? ANALYTICS_TOP_EARNERS_LIMIT;
}

export function resolveInsightBottomLimit(normalizedQuery: string): number {
  return extractInsightBottomLimit(normalizedQuery) ?? ANALYTICS_TOP_EARNERS_LIMIT;
}

/** @deprecated Use resolveInsightTopLimit */
export const resolveInsightTopEarnersLimit = resolveInsightTopLimit;

/** @deprecated Use resolveInsightBottomLimit */
export const resolveInsightBottomEarnersLimit = resolveInsightBottomLimit;

export const INSIGHT_MAX_RANKED_EARNERS_LIMIT = MAX_RANKED_EARNERS_LIMIT;
