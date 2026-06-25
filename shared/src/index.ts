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
  EMPLOYEE_EMPLOYMENT_STATUSES,
  listEmployeesQuerySchema,
  MAX_EMPLOYEE_LIMIT,
  type EmployeeDirectoryStats,
  type EmployeeEmploymentStatus,
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
  analyticsSummaryQuerySchema,
  convertCurrencyAmount,
  createTestExchangeRateSnapshot,
  DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
  getAnalyticsDisplayCurrencyRateToUsd,
  TEST_EXCHANGE_RATES_TO_USD,
  type AnalyticsCurrenciesResponse,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsDisplayCurrency,
  type AnalyticsSummaryQuery,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
  type DepartmentSalaryStatistics,
  type ExchangeRateSnapshot,
  type ExchangeRatesToUsd,
  type TopEarner,
} from "./analytics";

export {
  AI_INSIGHT_INTENTS,
  DEFAULT_INSIGHT_CURRENCY,
  DEFAULT_INSIGHT_NEAR_MEDIAN_TOLERANCE_PERCENT,
  DEFAULT_INSIGHT_TIMELINE_MONTHS,
  DEFAULT_RECENT_PROMOTIONS_MONTHS,
  INSIGHT_EXECUTION_ERROR_KINDS,
  INSIGHT_QUERY_COUNTRIES,
  INSIGHT_QUERY_DEPARTMENTS,
  insightQueryRequestSchema,
  insightScopeQuerySchema,
  insightAnalyticsQuerySchema,
  insightTopEarnersQuerySchema,
  type AiInsightIntent,
  type ExecuteInsightQueryResponse,
  type InsightAvgDeptSalaryResult,
  type InsightExecutionError,
  type InsightExecutionErrorKind,
  type InsightExecutionResult,
  type InsightHeadcountResult,
  type InsightMedianDeptSalaryResult,
  type InsightQueryCountry,
  type InsightQueryDepartment,
  type InsightQueryRequest,
  type InsightRecentPromotionsResult,
  type InsightRecentNewHiresResult,
  type InsightRecentSalaryIncreasesResult,
  type InsightTimelineEvent,
  type InsightTopEarnersResult,
  type InsightBottomEarnersResult,
  type InsightNearMedianEarnersResult,
  type InsightTotalPayrollResult,
  type ParseInsightQueryResponse,
  type ParsedInsightQuery,
  type PromotedEmployee,
} from "./ai-insights";
