import type {
  CreateEmployeeInput,
  EmployeeFilterOptions,
  EmployeeCompensationHistoryResponse,
  EmployeeProfileResponse,
  ListEmployeesQuery,
  PaginatedEmployeesResponse,
  RecordCompensationChangeInput,
  RecordCompensationChangeResponse,
  UpdateEmployeeInput,
} from "@acme/shared";

import { ApiRequestError, apiDelete, apiFetch, apiPatchJson, apiPostJson } from "./client";

export type EmployeeListParams = Partial<
  Pick<
    ListEmployeesQuery,
    "page" | "limit" | "search" | "country" | "department" | "jobTitle" | "employmentStatus"
  >
>;

function buildEmployeeListQuery(params: EmployeeListParams): string {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.country) searchParams.set("country", params.country);
  if (params.department) searchParams.set("department", params.department);
  if (params.jobTitle) searchParams.set("jobTitle", params.jobTitle);
  if (params.employmentStatus) searchParams.set("employmentStatus", params.employmentStatus);

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listEmployees(
  params: EmployeeListParams = {},
): Promise<PaginatedEmployeesResponse> {
  return apiFetch<PaginatedEmployeesResponse>(
    `/api/backend/employees${buildEmployeeListQuery(params)}`,
  );
}

export async function listEmployeeFilterOptions(): Promise<EmployeeFilterOptions> {
  return apiFetch<EmployeeFilterOptions>("/api/backend/employees/filter-options");
}

export async function getEmployeeProfile(
  employeeId: string,
): Promise<EmployeeProfileResponse> {
  return apiFetch<EmployeeProfileResponse>(`/api/backend/employees/${employeeId}`);
}

export async function listEmployeeCompensationHistory(
  employeeId: string,
): Promise<EmployeeCompensationHistoryResponse> {
  return apiFetch<EmployeeCompensationHistoryResponse>(
    `/api/backend/employees/${employeeId}/compensation`,
  );
}

export async function recordCompensationChange(
  employeeId: string,
  input: RecordCompensationChangeInput,
): Promise<RecordCompensationChangeResponse> {
  return apiPostJson<RecordCompensationChangeResponse>(
    `/api/backend/employees/${employeeId}/compensation`,
    input,
  );
}

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<EmployeeProfileResponse> {
  return apiPostJson<EmployeeProfileResponse>("/api/backend/employees", input);
}

export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeProfileResponse> {
  return apiPatchJson<EmployeeProfileResponse>(`/api/backend/employees/${employeeId}`, input);
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  await apiDelete(`/api/backend/employees/${employeeId}`);
}

export { ApiRequestError };
