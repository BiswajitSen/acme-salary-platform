import {
  DEFAULT_INSIGHT_CURRENCY,
  type AiInsightIntent,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
  type DepartmentSalaryStatistics,
  type ExecuteInsightQueryResponse,
  type InsightExecutionError,
  type InsightExecutionResult,
  type ParsedInsightQuery,
} from "@acme/shared";

export type InsightExecutorContext = {
  getAnalyticsSummary(currency: string): Promise<AnalyticsSummaryResponse>;
  getDepartmentSalaryStatistics(
    currency: string,
  ): Promise<AnalyticsDepartmentStatisticsResponse>;
  getTopEarners(currency: string): Promise<AnalyticsTopEarnersResponse>;
};

function resolveInsightCurrency(currency: string | null): string {
  return currency ?? DEFAULT_INSIGHT_CURRENCY;
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

function buildDepartmentNotFoundResponse(
  parsedQuery: ParsedInsightQuery,
  department: string,
  currency: string,
): ExecuteInsightQueryResponse {
  return {
    parsedQuery,
    result: null,
    error: {
      kind: "DEPARTMENT_NOT_FOUND",
      message: `No salary data found for ${department} in ${currency}.`,
    },
  };
}

async function loadDepartmentStatistics(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<
  | { currency: string; department: string; stats: DepartmentSalaryStatistics }
  | ExecuteInsightQueryResponse
> {
  const currency = resolveInsightCurrency(parsedQuery.currency);
  const department = parsedQuery.department;

  if (!department) {
    return buildDepartmentNotFoundResponse(parsedQuery, "the requested department", currency);
  }

  const response = await context.getDepartmentSalaryStatistics(currency);
  const stats = response.departments.find((row) => row.department === department);

  if (!stats) {
    return buildDepartmentNotFoundResponse(parsedQuery, department, currency);
  }

  return { currency, department, stats };
}

async function executeAvgDeptSalaryIntent(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  const loaded = await loadDepartmentStatistics(parsedQuery, context);

  if ("parsedQuery" in loaded) {
    return loaded;
  }

  return {
    parsedQuery,
    result: {
      intent: "AVG_DEPT_SALARY",
      currency: loaded.currency,
      department: loaded.department,
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
  const loaded = await loadDepartmentStatistics(parsedQuery, context);

  if ("parsedQuery" in loaded) {
    return loaded;
  }

  return {
    parsedQuery,
    result: {
      intent: "MEDIAN_DEPT_SALARY",
      currency: loaded.currency,
      department: loaded.department,
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
  const summary = await context.getAnalyticsSummary(currency);

  return {
    parsedQuery,
    result: {
      intent: "HEADCOUNT",
      currency,
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
  const summary = await context.getAnalyticsSummary(currency);

  return {
    parsedQuery,
    result: {
      intent: "TOTAL_PAYROLL",
      currency,
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
  const response = await context.getTopEarners(currency);

  return {
    parsedQuery,
    result: {
      intent: "TOP_EARNERS",
      currency,
      earners: response.earners,
    },
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
};

export async function executeParsedInsightQuery(
  parsedQuery: ParsedInsightQuery,
  context: InsightExecutorContext,
): Promise<ExecuteInsightQueryResponse> {
  if (parsedQuery.intent === "UNKNOWN") {
    return buildUnsupportedIntentResponse(parsedQuery);
  }

  return INSIGHT_EXECUTORS[parsedQuery.intent](parsedQuery, context);
}

export type { InsightExecutionError, InsightExecutionResult };
