export {
  COMPENSATION_REASONS,
  COMPENSATION_TIMELINE_ORDER,
  isSalaryIncreaseReason,
  NEW_HIRE_REQUIRES_EMPTY_HISTORY_MESSAGE,
  recordCompensationChangeSchema,
  SALARY_INCREASE_REASONS,
  type CompensationReason,
  type CompensationTimelineEntry,
  type CurrentCompensation,
  type EmployeeCompensationHistoryResponse,
  type EmployeeProfileResponse,
  type RecordCompensationChangeInput,
  type RecordCompensationChangeResponse,
  type SalaryIncreaseReason,
} from "./compensation.js";

export {
  isoCurrencyCodeSchema,
  isoDateSchema,
  requiredEffectiveDateSchema,
} from "./zod-fields.js";

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
  createEmployeeSchema,
  DEFAULT_EMPLOYEE_LIMIT,
  DEFAULT_EMPLOYEE_PAGE,
  employeeCoreFieldsSchema,
  EMPLOYEE_EMPLOYMENT_STATUSES,
  EMPLOYEE_JOB_TITLES,
  listEmployeesQuerySchema,
  MAX_EMPLOYEE_LIMIT,
  updateEmployeeSchema,
  type CreateEmployeeInput,
  type EmployeeDirectoryStats,
  type EmployeeEmploymentStatus,
  type EmployeeJobTitle,
  type EmployeeSummary,
  type EmployeeFilterOptions,
  type ListEmployeesQuery,
  type PaginatedEmployeesResponse,
  type PaginationMeta,
  type UpdateEmployeeInput,
} from "./employees.js";

export type {
  CompensationImportPreviewResponse,
  CompensationImportRecord,
  CompensationImportResultResponse,
  CompensationImportValidationErrorResponse,
  CompensationImportValidationIssue,
} from "./compensation-import.js";

export type {
  EmployeeImportPreviewResponse,
  EmployeeImportResultResponse,
  EmployeeImportValidationErrorResponse,
  EmployeeImportValidationIssue,
} from "./employee-import.js";

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
  type AnalyticsCompensatedEmployee,
  type AnalyticsCompensatedEmployeesResponse,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsDisplayCurrency,
  type AnalyticsSummaryQuery,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
  type DepartmentSalaryStatistics,
  type ExchangeRateSnapshot,
  type ExchangeRatesToUsd,
  type TopEarner,
} from "./analytics.js";

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
  type InsightMedianSplitCountsResult,
  type InsightMedianSplitFocus,
  type InsightTotalPayrollResult,
  type ParseInsightQueryResponse,
  type ParsedInsightQuery,
  type PromotedEmployee,
} from "./ai-insights.js";
