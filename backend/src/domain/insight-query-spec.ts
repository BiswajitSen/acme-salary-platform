import {
  DEFAULT_RECENT_PROMOTIONS_MONTHS,
  type AiInsightIntent,
  type ParsedInsightQuery,
} from "@acme/shared";

export type InsightQueryFilterDimension = "country" | "department" | "months";

export type InsightQueryFilters = {
  country: string | null;
  department: string | null;
  months: number | null;
};

export type InsightQueryMetric = Exclude<AiInsightIntent, "UNKNOWN">;

export type InsightQuerySpec = {
  metric: InsightQueryMetric;
  filters: InsightQueryFilters;
  currency: string | null;
  originalQuery: string;
};

const METRIC_FILTER_SUPPORT: Record<
  InsightQueryMetric,
  Record<InsightQueryFilterDimension, boolean>
> = {
  AVG_DEPT_SALARY: { country: true, department: true, months: false },
  MEDIAN_DEPT_SALARY: { country: true, department: true, months: false },
  HEADCOUNT: { country: true, department: true, months: false },
  TOTAL_PAYROLL: { country: true, department: true, months: false },
  TOP_EARNERS: { country: true, department: true, months: false },
  RECENT_PROMOTIONS: { country: true, department: true, months: true },
};

export function metricSupportsFilter(
  metric: InsightQueryMetric,
  dimension: InsightQueryFilterDimension,
): boolean {
  return METRIC_FILTER_SUPPORT[metric][dimension];
}

export function extractInsightQueryFilters(
  parsedQuery: ParsedInsightQuery,
): InsightQueryFilters {
  return {
    country: parsedQuery.country ?? null,
    department: parsedQuery.department ?? null,
    months:
      parsedQuery.intent === "RECENT_PROMOTIONS"
        ? (parsedQuery.months ?? DEFAULT_RECENT_PROMOTIONS_MONTHS)
        : null,
  };
}

export function buildInsightQuerySpec(
  parsedQuery: ParsedInsightQuery,
): InsightQuerySpec | null {
  if (parsedQuery.intent === "UNKNOWN") {
    return null;
  }

  return {
    metric: parsedQuery.intent,
    filters: extractInsightQueryFilters(parsedQuery),
    currency: parsedQuery.currency,
    originalQuery: parsedQuery.originalQuery,
  };
}

export function hasScopedInsightFilters(filters: InsightQueryFilters): boolean {
  return filters.country !== null || filters.department !== null;
}

export function shouldReportScopedEmptyResult(
  filters: InsightQueryFilters,
  hasResults: boolean,
): boolean {
  return hasScopedInsightFilters(filters) && !hasResults;
}
