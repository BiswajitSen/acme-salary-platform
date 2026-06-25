import {
  DEFAULT_INSIGHT_TIMELINE_MONTHS,
  type AiInsightIntent,
  type ParsedInsightQuery,
} from "@acme/shared";

import type { EmployeeScopeParams } from "./analytics-employee-scope.js";
import { hasEmployeeScope } from "./analytics-employee-scope.js";
import { isInsightTimelineIntent } from "./insight-query-timeline.js";

export type InsightQueryFilterDimension =
  | "country"
  | "department"
  | "jobTitle"
  | "months"
  | "sinceDate"
  | "limit";

export type InsightQueryFilters = {
  country: string | null;
  department: string | null;
  jobTitle: string | null;
  months: number | null;
  sinceDate: string | null;
  limit: number | null;
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
  AVG_DEPT_SALARY: {
    country: true,
    department: true,
    jobTitle: true,
    months: false,
    sinceDate: false,
    limit: false,
  },
  MEDIAN_DEPT_SALARY: {
    country: true,
    department: true,
    jobTitle: true,
    months: false,
    sinceDate: false,
    limit: false,
  },
  HEADCOUNT: {
    country: true,
    department: true,
    jobTitle: true,
    months: false,
    sinceDate: false,
    limit: false,
  },
  TOTAL_PAYROLL: {
    country: true,
    department: true,
    jobTitle: true,
    months: false,
    sinceDate: false,
    limit: false,
  },
  TOP_EARNERS: {
    country: true,
    department: true,
    jobTitle: true,
    months: false,
    sinceDate: false,
    limit: true,
  },
  BOTTOM_EARNERS: {
    country: true,
    department: true,
    jobTitle: true,
    months: false,
    sinceDate: false,
    limit: true,
  },
  NEAR_MEDIAN_EARNERS: {
    country: true,
    department: true,
    jobTitle: true,
    months: false,
    sinceDate: false,
    limit: false,
  },
  RECENT_PROMOTIONS: {
    country: true,
    department: true,
    jobTitle: true,
    months: true,
    sinceDate: true,
    limit: false,
  },
  RECENT_NEW_HIRES: {
    country: true,
    department: true,
    jobTitle: true,
    months: true,
    sinceDate: true,
    limit: false,
  },
  RECENT_SALARY_INCREASES: {
    country: true,
    department: true,
    jobTitle: true,
    months: true,
    sinceDate: true,
    limit: false,
  },
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
    jobTitle: parsedQuery.jobTitle ?? null,
    months:
      isInsightTimelineIntent(parsedQuery.intent)
        ? (parsedQuery.months ?? DEFAULT_INSIGHT_TIMELINE_MONTHS)
        : null,
    sinceDate: parsedQuery.sinceDate ?? null,
    limit: parsedQuery.limit ?? null,
  };
}

export function toEmployeeScopeParams(filters: InsightQueryFilters): EmployeeScopeParams {
  return {
    ...(filters.country === null ? {} : { country: filters.country }),
    ...(filters.department === null ? {} : { department: filters.department }),
    ...(filters.jobTitle === null ? {} : { jobTitle: filters.jobTitle }),
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
  return hasEmployeeScope(toEmployeeScopeParams(filters));
}

export function shouldReportScopedEmptyResult(
  filters: InsightQueryFilters,
  hasResults: boolean,
): boolean {
  return hasScopedInsightFilters(filters) && !hasResults;
}

export function scopedResultFields(
  filters: InsightQueryFilters,
): {
  country: string | null;
  department: string | null;
  jobTitle: string | null;
} {
  return {
    country: filters.country,
    department: filters.department,
    jobTitle: filters.jobTitle,
  };
}

export function timelineResultScope(
  filters: InsightQueryFilters,
): {
  country: string | null;
  department: string | null;
  jobTitle: string | null;
  months: number | null;
  sinceDate: string | null;
} {
  return {
    ...scopedResultFields(filters),
    months: filters.sinceDate === null ? filters.months : null,
    sinceDate: filters.sinceDate,
  };
}
