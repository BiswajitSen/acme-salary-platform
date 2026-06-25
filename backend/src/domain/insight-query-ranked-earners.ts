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

export function extractInsightTopEarnersLimit(normalizedQuery: string): number | null {
  return parseRankedLimit(normalizedQuery.match(/\btop\s+(\d+)\s+earners?\b/i));
}

export function extractInsightBottomEarnersLimit(normalizedQuery: string): number | null {
  return parseRankedLimit(
    normalizedQuery.match(/\b(?:bottom|least|lowest)\s+(\d+)\s+earners?\b/i),
  );
}

export function resolveInsightTopEarnersLimit(normalizedQuery: string): number {
  return extractInsightTopEarnersLimit(normalizedQuery) ?? ANALYTICS_TOP_EARNERS_LIMIT;
}

export function resolveInsightBottomEarnersLimit(normalizedQuery: string): number {
  return extractInsightBottomEarnersLimit(normalizedQuery) ?? ANALYTICS_TOP_EARNERS_LIMIT;
}

export const INSIGHT_MAX_RANKED_EARNERS_LIMIT = MAX_RANKED_EARNERS_LIMIT;
