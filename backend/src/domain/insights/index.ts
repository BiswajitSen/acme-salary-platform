export { parseInsightQuery } from "./parse-query.js";
export type { InsightQueryExecution } from "./execute-query.js";
export { executeParsedInsightQuery } from "./execute-query.js";
export type { InsightExecutorContext } from "./executor-context.js";
export type { InsightExecutionError, InsightExecutionResult } from "@acme/shared";

export { validateInsightExecutionSafety } from "./validate-execution.js";
export { resolveInsightExecutionCurrency } from "./execution-currency.js";

export {
  parseInsightAnalyticsQuery,
  parseInsightTimelineQuery,
  parseInsightTopEarnersQuery,
  toEmployeeScopeFromQuery,
} from "./analytics-query.js";

export type { EmployeeScopeParams } from "./employee-scope.js";
export { buildEmployeeScopeFilter, hasEmployeeScope } from "./employee-scope.js";

export {
  INSIGHT_TIMELINE_INTENTS,
  INSIGHT_TIMELINE_INTENT_REASONS,
  DEFAULT_INSIGHT_TIMELINE_MONTHS,
  isInsightTimelineIntent,
  resolveTimelineReasons,
  type InsightTimelineIntent,
} from "./timeline/timeline.js";

export type { InsightTimelineWindow } from "./timeline/window.js";
export { buildTimelineStartExpression } from "./timeline/window.js";

export {
  extractInsightQueryFilters,
  metricSupportsFilter,
  type InsightQueryFilterDimension,
  type InsightQueryFilters,
  type InsightQueryMetric,
} from "./query-spec.js";

export { formatInsightScopeLabel, hasInsightEmployeeScope } from "./scope-label.js";
