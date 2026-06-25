import {
  DEFAULT_INSIGHT_CURRENCY,
  type AnalyticsTopEarnersResponse,
  type InsightExecutionResult,
  type InsightTimelineEvent,
  type ParsedInsightQuery,
} from "@acme/shared";

import type { EmployeeScopeParams } from "./employee-scope.js";
import type { InsightExecutorContext } from "./executor-context.js";
import type { InsightQueryExecution } from "./execute-query.js";
import { resolveInsightBottomLimit, resolveInsightTopLimit } from "./filters/ranked-limits.js";
import { resolveNearMedianTolerancePercent } from "./filters/near-median.js";
import {
  extractInsightQueryFilters,
  scopedResultFields,
  shouldReportScopedEmptyResult,
  timelineResultScope,
  toEmployeeScopeParams,
  type InsightQueryFilters,
} from "./query-spec.js";
import { formatInsightScopeLabel } from "./scope-label.js";
import { parseSafeInsightCurrency } from "./safety.js";
import { resolveTimelineReasons, type InsightTimelineIntent } from "./timeline/timeline.js";

type ExecutionContext = {
  currency: string;
  filters: InsightQueryFilters;
  scope: EmployeeScopeParams;
};

function resolveInsightCurrency(currency: string | null): string {
  if (currency === null) {
    return DEFAULT_INSIGHT_CURRENCY;
  }

  return parseSafeInsightCurrency(currency)!;
}

function buildExecutionContext(parsedQuery: ParsedInsightQuery): ExecutionContext {
  const filters = extractInsightQueryFilters(parsedQuery);

  return {
    currency: resolveInsightCurrency(parsedQuery.currency),
    filters,
    scope: toEmployeeScopeParams(filters),
  };
}

function buildScopeNotFoundResponse(
  parsedQuery: ParsedInsightQuery,
  currency: string,
): InsightQueryExecution {
  return {
    parsedQuery,
    result: null,
    error: {
      kind: "COUNTRY_NOT_FOUND",
      message: `No salary data found for ${formatInsightScopeLabel(parsedQuery)} (amounts shown in ${currency}).`,
    },
  };
}

async function loadScopedSalaryStatistics(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<
  | (ExecutionContext & {
      stats: { employeeCount: number; averageSalary: number; medianSalary: number };
    })
  | InsightQueryExecution
> {
  const execution = buildExecutionContext(parsedQuery);
  const stats = await context.getScopedSalaryStatistics(execution.currency, execution.scope);

  if (shouldReportScopedEmptyResult(execution.filters, stats.employeeCount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, execution.currency);
  }

  return { ...execution, stats };
}

async function executeRankedEarnersIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
  config: {
    intent: "TOP_EARNERS" | "BOTTOM_EARNERS";
    resolveLimit: (normalizedQuery: string) => number;
    fetchEarners: (
      context: InsightExecutorContext,
      currency: string,
      scope: EmployeeScopeParams,
      limit: number,
    ) => Promise<AnalyticsTopEarnersResponse>;
  },
): Promise<InsightQueryExecution> {
  const execution = buildExecutionContext(parsedQuery);
  const limit =
    execution.filters.limit ??
    config.resolveLimit(parsedQuery.originalQuery.toLowerCase());
  const response = await config.fetchEarners(
    context,
    execution.currency,
    execution.scope,
    limit,
  );

  if (shouldReportScopedEmptyResult(execution.filters, response.earners.length > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, execution.currency);
  }

  return {
    parsedQuery,
    result: {
      intent: config.intent,
      currency: execution.currency,
      ...scopedResultFields(execution.filters),
      limit,
      earners: response.earners,
    },
    error: null,
  };
}

export async function executeAvgDeptSalaryIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<InsightQueryExecution> {
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

export async function executeMedianDeptSalaryIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<InsightQueryExecution> {
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

export async function executeHeadcountIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<InsightQueryExecution> {
  const execution = buildExecutionContext(parsedQuery);
  const summary = await context.getAnalyticsSummary(execution.currency, execution.scope);

  if (shouldReportScopedEmptyResult(execution.filters, summary.headcount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, execution.currency);
  }

  return {
    parsedQuery,
    result: {
      intent: "HEADCOUNT",
      currency: execution.currency,
      ...scopedResultFields(execution.filters),
      headcount: summary.headcount,
    },
    error: null,
  };
}

export async function executeTotalPayrollIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<InsightQueryExecution> {
  const execution = buildExecutionContext(parsedQuery);
  const summary = await context.getAnalyticsSummary(execution.currency, execution.scope);

  if (shouldReportScopedEmptyResult(execution.filters, summary.headcount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, execution.currency);
  }

  return {
    parsedQuery,
    result: {
      intent: "TOTAL_PAYROLL",
      currency: execution.currency,
      ...scopedResultFields(execution.filters),
      totalPayroll: summary.totalPayroll,
    },
    error: null,
  };
}

export async function executeTopEarnersIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<InsightQueryExecution> {
  return executeRankedEarnersIntent(parsedQuery, context, {
    intent: "TOP_EARNERS",
    resolveLimit: resolveInsightTopLimit,
    fetchEarners: (ctx, currency, scope, limit) => ctx.getTopEarners(currency, scope, limit),
  });
}

export async function executeBottomEarnersIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<InsightQueryExecution> {
  return executeRankedEarnersIntent(parsedQuery, context, {
    intent: "BOTTOM_EARNERS",
    resolveLimit: resolveInsightBottomLimit,
    fetchEarners: (ctx, currency, scope, limit) => ctx.getBottomEarners(currency, scope, limit),
  });
}

export async function executeNearMedianEarnersIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<InsightQueryExecution> {
  const execution = buildExecutionContext(parsedQuery);
  const tolerancePercent = resolveNearMedianTolerancePercent(
    parsedQuery.originalQuery.toLowerCase(),
  );
  const stats = await context.getScopedSalaryStatistics(execution.currency, execution.scope);

  if (shouldReportScopedEmptyResult(execution.filters, stats.employeeCount > 0)) {
    return buildScopeNotFoundResponse(parsedQuery, execution.currency);
  }

  const response = await context.getNearMedianEarners(
    execution.currency,
    execution.scope,
    tolerancePercent,
  );

  return {
    parsedQuery,
    result: {
      intent: "NEAR_MEDIAN_EARNERS",
      currency: execution.currency,
      ...scopedResultFields(execution.filters),
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

export async function executeTimelineIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
  intent: InsightTimelineIntent,
): Promise<InsightQueryExecution> {
  const filters = extractInsightQueryFilters(parsedQuery);
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
