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
  analyticsSummaryQuerySchema,
  type AnalyticsCurrenciesResponse,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsSummaryQuery,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
  type DepartmentSalaryStatistics,
  type TopEarner,
} from "./analytics";

export {
  AI_INSIGHT_INTENTS,
  INSIGHT_QUERY_DEPARTMENTS,
  insightQueryRequestSchema,
  type AiInsightIntent,
  type InsightQueryDepartment,
  type InsightQueryRequest,
  type ParseInsightQueryResponse,
  type ParsedInsightQuery,
} from "./ai-insights";
