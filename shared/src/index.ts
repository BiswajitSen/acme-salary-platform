export {
  COMPENSATION_REASONS,
  COMPENSATION_TIMELINE_ORDER,
  recordCompensationChangeSchema,
  type CompensationReason,
  type CompensationTimelineEntry,
  type CurrentCompensation,
  type EmployeeCompensationHistoryResponse,
  type EmployeeProfileResponse,
  type RecordCompensationChangeInput,
  type RecordCompensationChangeResponse,
} from "./compensation";

export type HealthStatus = {
  status: "ok";
  database: "connected";
  employees: number;
  compensationRecords: number;
};

export type ApiError = {
  error: string;
  message: string;
};

export {
  DEFAULT_EMPLOYEE_LIMIT,
  DEFAULT_EMPLOYEE_PAGE,
  listEmployeesQuerySchema,
  MAX_EMPLOYEE_LIMIT,
  type EmployeeSummary,
  type EmployeeFilterOptions,
  type ListEmployeesQuery,
  type PaginatedEmployeesResponse,
  type PaginationMeta,
} from "./employees";

export type {
  CompensationImportPreviewResponse,
  CompensationImportRecord,
  CompensationImportResultResponse,
  CompensationImportValidationErrorResponse,
  CompensationImportValidationIssue,
} from "./compensation-import";

export type {
  EmployeeImportPreviewResponse,
  EmployeeImportResultResponse,
  EmployeeImportValidationErrorResponse,
  EmployeeImportValidationIssue,
} from "./employee-import";

export {
  ANALYTICS_TOP_EARNERS_LIMIT,
  ANALYTICS_DISPLAY_CURRENCIES,
  ANALYTICS_EXCHANGE_RATES_TO_USD,
  analyticsSummaryQuerySchema,
  convertCurrencyAmount,
  DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
  getAnalyticsDisplayCurrencyRateToUsd,
  type AnalyticsCurrenciesResponse,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsDisplayCurrency,
  type AnalyticsSummaryQuery,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
  type DepartmentSalaryStatistics,
  type TopEarner,
} from "./analytics";

export {
  AI_INSIGHT_INTENTS,
  DEFAULT_INSIGHT_CURRENCY,
  INSIGHT_EXECUTION_ERROR_KINDS,
  INSIGHT_QUERY_DEPARTMENTS,
  insightQueryRequestSchema,
  type AiInsightIntent,
  type ExecuteInsightQueryResponse,
  type InsightAvgDeptSalaryResult,
  type InsightExecutionError,
  type InsightExecutionErrorKind,
  type InsightExecutionResult,
  type InsightHeadcountResult,
  type InsightMedianDeptSalaryResult,
  type InsightQueryDepartment,
  type InsightQueryRequest,
  type InsightTopEarnersResult,
  type InsightTotalPayrollResult,
  type ParseInsightQueryResponse,
  type ParsedInsightQuery,
} from "./ai-insights";
