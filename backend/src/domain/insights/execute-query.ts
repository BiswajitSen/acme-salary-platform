import type { AiInsightIntent, ExecuteInsightQueryResponse, ParsedInsightQuery } from "@acme/shared";

import type { InsightExecutorContext } from "./executor-context.js";
import {
  executeAvgDeptSalaryIntent,
  executeBottomEarnersIntent,
  executeHeadcountIntent,
  executeMedianDeptSalaryIntent,
  executeNearMedianEarnersIntent,
  executeTimelineIntent,
  executeTopEarnersIntent,
  executeTotalPayrollIntent,
} from "./executors.js";
import { validateInsightExecutionSafety } from "./validate-execution.js";

export type { InsightExecutorContext } from "./executor-context.js";
export type { InsightExecutionError, InsightExecutionResult } from "@acme/shared";

export type InsightQueryExecution = Omit<ExecuteInsightQueryResponse, "exchangeRatesAsOf">;

const INSIGHT_EXECUTORS: Record<
  Exclude<AiInsightIntent, "UNKNOWN">,
  (
    parsedQuery: ParsedInsightQuery,
    context: InsightExecutorContext,
  ) => Promise<InsightQueryExecution>
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
): Promise<InsightQueryExecution> {
  const safetyError = validateInsightExecutionSafety(parsedQuery);

  if (safetyError) {
    return {
      parsedQuery,
      result: null,
      error: safetyError,
    };
  }

  if (parsedQuery.intent === "UNKNOWN") {
    return {
      parsedQuery,
      result: null,
      error: {
        kind: "UNSUPPORTED_INTENT",
        message: "This question is not supported yet.",
      },
    };
  }

  return INSIGHT_EXECUTORS[parsedQuery.intent](parsedQuery, context);
}
