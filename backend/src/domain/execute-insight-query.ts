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

import {
  extractInsightQueryFilters,
  shouldReportScopedEmptyResult,
  type InsightQueryFilters,
} from "./insight-query-spec.js";
import {
  type InsightTimelineIntent,
} from "./insight-query-timeline.js";
import { parseSafeInsightCurrency } from "./insight-query-safety.js";
import { formatInsightScopeLabel } from "./insight-query-scope.js";
import { validateInsightExecutionSafety } from "./validate-insight-execution.js";

export type InsightExecutorContext = {
  getAnalyticsSummary(
    currency: string,
    country: string | null,
    department: string | null,
  ): Promise<AnalyticsSummaryResponse>;
  getScopedSalaryStatistics(
    currency: string,
    country: string | null,
    department: string | null,
  ): Promise<{
    currency: string;
    employeeCount: number;
    averageSalary: number;
    medianSalary: number;
  }>;
  getTopEarners(
    currency: string,
    country: string | null,
    department: string | null,
  ): Promise<AnalyticsTopEarnersResponse>;
  getRecentTimelineEvents(
    intent: InsightTimelineIntent,
    months: number,
    country: string | null,
    department: string | null,
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
  const response = await context.getScopedSalaryStatistics(
    currency,
    filters.country,
    filters.department,
  );

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
      country: loaded.filters.country,
      department: loaded.filters.department,
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
      country: loaded.filters.country,
      department: loaded.filters.department,
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
  const summary = await context.getAnalyticsSummary(
    currency,
    filters.country,
    filters.department,
  );

  if (shouldReportScopedEmptyResult(filters, summary.headcount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    parsedQuery,
    result: {
      intent: "HEADCOUNT",
      currency,
      country: filters.country,
      department: filters.department,
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
  const summary = await context.getAnalyticsSummary(
    currency,
    filters.country,
    filters.department,
  );

  if (shouldReportScopedEmptyResult(filters, summary.headcount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    parsedQuery,
    result: {
      intent: "TOTAL_PAYROLL",
      currency,
      country: filters.country,
      department: filters.department,
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
  const response = await context.getTopEarners(
    currency,
    filters.country,
    filters.department,
  );

  if (shouldReportScopedEmptyResult(filters, response.earners.length > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    parsedQuery,
    result: {
      intent: "TOP_EARNERS",
      currency,
      country: filters.country,
      department: filters.department,
      earners: response.earners,
    },
    error: null,
  };
}

function buildTimelineResult(
  intent: InsightTimelineIntent,
  parsedQuery: ParsedInsightQuery,
  months: number,
  filters: InsightQueryFilters,
  events: InsightTimelineEvent[],
): InsightExecutionResult {
  switch (intent) {
    case "RECENT_PROMOTIONS":
      return {
        intent,
        months,
        country: filters.country,
        department: filters.department,
        promotions: events,
      };
    case "RECENT_NEW_HIRES":
      return {
        intent,
        months,
        country: filters.country,
        department: filters.department,
        hires: events,
      };
    case "RECENT_SALARY_INCREASES":
      return {
        intent,
        months,
        country: filters.country,
        department: filters.department,
        increases: events,
      };
  }
}

async function executeTimelineIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
  intent: InsightTimelineIntent,
): Promise<ExecuteInsightQueryResponse> {
  const filters = resolveFilters(parsedQuery);
  const months = filters.months ?? DEFAULT_INSIGHT_TIMELINE_MONTHS;
  const response = await context.getRecentTimelineEvents(
    intent,
    months,
    filters.country,
    filters.department,
  );

  if (shouldReportScopedEmptyResult(filters, response.events.length > 0)) {
    const currency = resolveInsightCurrency(parsedQuery.currency);
    return buildScopeNotFoundResponse(parsedQuery, currency);
  }

  return {
    parsedQuery,
    result: buildTimelineResult(intent, parsedQuery, months, filters, response.events),
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
