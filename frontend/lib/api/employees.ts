import type {
  EmployeeFilterOptions,
  EmployeeCompensationHistoryResponse,
  EmployeeProfileResponse,
  ListEmployeesQuery,
  PaginatedEmployeesResponse,
} from "@acme/shared";

import { apiFetch } from "./client";

export type EmployeeListParams = Partial<
  Pick<ListEmployeesQuery, "page" | "limit" | "search" | "country" | "department" | "jobTitle">
>;

function buildEmployeeListQuery(params: EmployeeListParams): string {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.country) searchParams.set("country", params.country);
  if (params.department) searchParams.set("department", params.department);
  if (params.jobTitle) searchParams.set("jobTitle", params.jobTitle);

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
