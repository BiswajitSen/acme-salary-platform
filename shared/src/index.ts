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
