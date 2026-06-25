import { DEFAULT_INSIGHT_NEAR_MEDIAN_TOLERANCE_PERCENT } from "@acme/shared";

const MAX_NEAR_MEDIAN_TOLERANCE_PERCENT = 50;

export function extractNearMedianTolerancePercent(normalizedQuery: string): number | null {
  const match = normalizedQuery.match(
    /\b(?:within|around|near|close to)\s+(\d+)\s*(?:%|percent)\s+(?:of\s+)?(?:the\s+)?median\b/i,
  );
  if (!match?.[1]) {
    return null;
  }

  const tolerance = Number.parseInt(match[1]!, 10);
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    return null;
  }

  return Math.min(tolerance, MAX_NEAR_MEDIAN_TOLERANCE_PERCENT);
}

export function resolveNearMedianTolerancePercent(normalizedQuery: string): number {
  return (
    extractNearMedianTolerancePercent(normalizedQuery) ??
    DEFAULT_INSIGHT_NEAR_MEDIAN_TOLERANCE_PERCENT
  );
}

/** @deprecated Use extractNearMedianTolerancePercent */
export const extractInsightNearMedianTolerancePercent = extractNearMedianTolerancePercent;

/** @deprecated Use resolveNearMedianTolerancePercent */
export const resolveInsightNearMedianTolerancePercent = resolveNearMedianTolerancePercent;
