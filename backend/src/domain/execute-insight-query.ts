import {
  DEFAULT_INSIGHT_CURRENCY,
  DEFAULT_INSIGHT_TIMELINE_MONTHS,
  type AiInsightIntent,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
  type ExecuteInsightQueryResponse,
  type InsightExecutionError,
  type InsightExecutionResult,
  type InsightTimelineEvent,
  type ParsedInsightQuery,
} from "@acme/shared";

import { resolveInsightBottomEarnersLimit, resolveInsightTopEarnersLimit } from "./insight-query-ranked-earners.js";
import { resolveInsightNearMedianTolerancePercent } from "./insight-query-near-median.js";
import {
  extractInsightQueryFilters,
  scopedResultFields,
  shouldReportScopedEmptyResult,
  timelineResultScope,
  toEmployeeScopeParams,
  type InsightQueryFilters,
} from "./insight-query-spec.js";
import {
  resolveTimelineReasons,
  type InsightTimelineIntent,
} from "./insight-query-timeline.js";
import { parseSafeInsightCurrency } from "./insight-query-safety.js";
import { formatInsightScopeLabel } from "./insight-query-scope.js";
import { validateInsightExecutionSafety } from "./validate-insight-execution.js";

export type InsightExecutorContext = {
  getAnalyticsSummary(
    currency: string,
    scope: ReturnType<typeof toEmployeeScopeParams>,
  ): Promise<AnalyticsSummaryResponse>;
  getScopedSalaryStatistics(
    currency: string,
    scope: ReturnType<typeof toEmployeeScopeParams>,
  ): Promise<{
    currency: string;
    employeeCount: number;
    averageSalary: number;
    medianSalary: number;
  }>;
  getTopEarners(
    currency: string,
    scope: ReturnType<typeof toEmployeeScopeParams>,
    limit: number,
  ): Promise<AnalyticsTopEarnersResponse>;
  getBottomEarners(
    currency: string,
    scope: ReturnType<typeof toEmployeeScopeParams>,
    limit: number,
  ): Promise<AnalyticsTopEarnersResponse>;
  getNearMedianEarners(
    currency: string,
    scope: ReturnType<typeof toEmployeeScopeParams>,
    tolerancePercent: number,
  ): Promise<AnalyticsTopEarnersResponse & { medianSalary: number; tolerancePercent: number }>;
  getRecentTimelineEvents(
    intent: InsightTimelineIntent,
    query: {
      months: number | null;
      sinceDate: string | null;
      country: string | null;
      department: string | null;
      jobTitle: string | null;
      reasons: readonly string[];
    },
  ): Promise<{ asOfDate: string; events: InsightTimelineEvent[] }>;
};

function resolveInsightCurrency(currency: string | null): string {
  if (currency === null) {
    return DEFAULT_INSIGHT_CURRENCY;
  }

  return parseSafeInsightCurrency(currency)!;
}

function buildRejectedInputResponse(
  parsedQuery: ParsedInsightQuery,
  error: InsightExecutionError,
): ExecuteInsightQueryResponse {
  return {
    parsedQuery,
    result: null,
    error,
  };
}

function buildUnsupportedIntentResponse(
  parsedQuery: ParsedInsightQuery,
): ExecuteInsightQueryResponse {
  return {
    parsedQuery,
    result: null,
    error: {
      kind: "UNSUPPORTED_INTENT",
      message: "This question is not supported yet.",
    },
  };
}

function buildScopeNotFoundResponse(
  parsedQuery: ParsedInsightQuery,
  currency: string,
): ExecuteInsightQueryResponse {
  return {
    parsedQuery,
    result: null,
    error: {
      kind: "COUNTRY_NOT_FOUND",
      message: `No salary data found for ${formatInsightScopeLabel(parsedQuery)} (amounts shown in ${currency}).`,
    },
  };
}

function resolveFilters(parsedQuery: ParsedInsightQuery): InsightQueryFilters {
  return extractInsightQueryFilters(parsedQuery);
}

async function loadScopedSalaryStatistics(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<
  | {
      currency: string;
      filters: InsightQueryFilters;
      stats: { employeeCount: number; averageSalary: number; medianSalary: number };
    }
  | ExecuteInsightQueryResponse
> {
  const currency = resolveInsightCurrency(parsedQuery.currency);
  const filters = resolveFilters(parsedQuery);
  const scope = toEmployeeScopeParams(filters);
  const response = await context.getScopedSalaryStatistics(currency, scope);

  if (shouldReportScopedEmptyResult(filters, response.employeeCount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    currency,
    filters,
    stats: response,
  };
}

async function executeAvgDeptSalaryIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  const loaded = await loadScopedSalaryStatistics(parsedQuery, context);

  if ("parsedQuery" in loaded) {
    return loaded;
  }

  return {
    parsedQuery,
    result: {
      intent: "AVG_DEPT_SALARY",
      currency: loaded.currency,
      ...scopedResultFields(loaded.filters),
      averageSalary: loaded.stats.averageSalary,
      employeeCount: loaded.stats.employeeCount,
    },
    error: null,
  };
}

async function executeMedianDeptSalaryIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  const loaded = await loadScopedSalaryStatistics(parsedQuery, context);

  if ("parsedQuery" in loaded) {
    return loaded;
  }

  return {
    parsedQuery,
    result: {
      intent: "MEDIAN_DEPT_SALARY",
      currency: loaded.currency,
      ...scopedResultFields(loaded.filters),
      medianSalary: loaded.stats.medianSalary,
      employeeCount: loaded.stats.employeeCount,
    },
    error: null,
  };
}

async function executeHeadcountIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  const currency = resolveInsightCurrency(parsedQuery.currency);
  const filters = resolveFilters(parsedQuery);
  const scope = toEmployeeScopeParams(filters);
  const summary = await context.getAnalyticsSummary(currency, scope);

  if (shouldReportScopedEmptyResult(filters, summary.headcount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    parsedQuery,
    result: {
      intent: "HEADCOUNT",
      currency,
      ...scopedResultFields(filters),
      headcount: summary.headcount,
    },
    error: null,
  };
}

async function executeTotalPayrollIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  const currency = resolveInsightCurrency(parsedQuery.currency);
  const filters = resolveFilters(parsedQuery);
  const scope = toEmployeeScopeParams(filters);
  const summary = await context.getAnalyticsSummary(currency, scope);

  if (shouldReportScopedEmptyResult(filters, summary.headcount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    parsedQuery,
    result: {
      intent: "TOTAL_PAYROLL",
      currency,
      ...scopedResultFields(filters),
      totalPayroll: summary.totalPayroll,
    },
    error: null,
  };
}

async function executeTopEarnersIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  const currency = resolveInsightCurrency(parsedQuery.currency);
  const filters = resolveFilters(parsedQuery);
  const scope = toEmployeeScopeParams(filters);
  const limit =
    filters.limit ??
    resolveInsightTopEarnersLimit(parsedQuery.originalQuery.toLowerCase());
  const response = await context.getTopEarners(currency, scope, limit);

  if (shouldReportScopedEmptyResult(filters, response.earners.length > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    parsedQuery,
    result: {
      intent: "TOP_EARNERS",
      currency,
      ...scopedResultFields(filters),
      limit,
      earners: response.earners,
    },
    error: null,
  };
}

async function executeBottomEarnersIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  const currency = resolveInsightCurrency(parsedQuery.currency);
  const filters = resolveFilters(parsedQuery);
  const scope = toEmployeeScopeParams(filters);
  const limit =
    filters.limit ??
    resolveInsightBottomEarnersLimit(parsedQuery.originalQuery.toLowerCase());
  const response = await context.getBottomEarners(currency, scope, limit);

  if (shouldReportScopedEmptyResult(filters, response.earners.length > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    parsedQuery,
    result: {
      intent: "BOTTOM_EARNERS",
      currency,
      ...scopedResultFields(filters),
      limit,
      earners: response.earners,
    },
    error: null,
  };
}

async function executeNearMedianEarnersIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  const currency = resolveInsightCurrency(parsedQuery.currency);
  const filters = resolveFilters(parsedQuery);
  const scope = toEmployeeScopeParams(filters);
  const tolerancePercent = resolveInsightNearMedianTolerancePercent(
    parsedQuery.originalQuery.toLowerCase(),
  );
  const stats = await context.getScopedSalaryStatistics(currency, scope);

  if (shouldReportScopedEmptyResult(filters, stats.employeeCount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  const response = await context.getNearMedianEarners(currency, scope, tolerancePercent);

  return {
    parsedQuery,
    result: {
      intent: "NEAR_MEDIAN_EARNERS",
      currency,
      ...scopedResultFields(filters),
      medianSalary: response.medianSalary,
      tolerancePercent,
      earners: response.earners,
    },
    error: null,
  };
}

function buildTimelineResult(
  intent: InsightTimelineIntent,
  filters: InsightQueryFilters,
  events: InsightTimelineEvent[],
): InsightExecutionResult {
  const scope = timelineResultScope(filters);

  switch (intent) {
    case "RECENT_PROMOTIONS":
      return { intent, ...scope, promotions: events };
    case "RECENT_NEW_HIRES":
      return { intent, ...scope, hires: events };
    case "RECENT_SALARY_INCREASES":
      return { intent, ...scope, increases: events };
  }
}

async function executeTimelineIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
  intent: InsightTimelineIntent,
): Promise<ExecuteInsightQueryResponse> {
  const filters = resolveFilters(parsedQuery);
  const normalizedQuery = parsedQuery.originalQuery.toLowerCase();
  const reasons = resolveTimelineReasons(intent, normalizedQuery);
  const response = await context.getRecentTimelineEvents(intent, {
    months: filters.sinceDate === null ? filters.months : null,
    sinceDate: filters.sinceDate,
    country: filters.country,
    department: filters.department,
    jobTitle: filters.jobTitle,
    reasons,
  });

  if (shouldReportScopedEmptyResult(filters, response.events.length > 0)) {
    const currency = resolveInsightCurrency(parsedQuery.currency);
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    parsedQuery,
    result: buildTimelineResult(intent, filters, response.events),
    error: null,
  };
}

const INSIGHT_EXECUTORS: Record<
  Exclude<AiInsightIntent, "UNKNOWN">,
  (
    parsedQuery: ParsedInsightQuery,
    context: InsightExecutorContext,
  ) => Promise<ExecuteInsightQueryResponse>
> = {
  AVG_DEPT_SALARY: executeAvgDeptSalaryIntent,
  MEDIAN_DEPT_SALARY: executeMedianDeptSalaryIntent,
  HEADCOUNT: executeHeadcountIntent,
  TOTAL_PAYROLL: executeTotalPayrollIntent,
  TOP_EARNERS: executeTopEarnersIntent,
  BOTTOM_EARNERS: executeBottomEarnersIntent,
  NEAR_MEDIAN_EARNERS: executeNearMedianEarnersIntent,
  RECENT_PROMOTIONS: (parsedQuery, context) =>
    executeTimelineIntent(parsedQuery, context, "RECENT_PROMOTIONS"),
  RECENT_NEW_HIRES: (parsedQuery, context) =>
    executeTimelineIntent(parsedQuery, context, "RECENT_NEW_HIRES"),
  RECENT_SALARY_INCREASES: (parsedQuery, context) =>
    executeTimelineIntent(parsedQuery, context, "RECENT_SALARY_INCREASES"),
};

export async function executeParsedInsightQuery(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  const safetyError = validateInsightExecutionSafety(parsedQuery);

  if (safetyError) {
    return buildRejectedInputResponse(parsedQuery, safetyError);
  }

  if (parsedQuery.intent === "UNKNOWN") {
    return buildUnsupportedIntentResponse(parsedQuery);
  }

  return INSIGHT_EXECUTORS[parsedQuery.intent](parsedQuery, context);
}

export type { InsightExecutionError, InsightExecutionResult };
