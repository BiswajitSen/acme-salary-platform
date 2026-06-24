import type { ListEmployeesQuery } from "@acme/shared";

export type EmployeeListFilters = {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
};

export function extractEmployeeListFilters(
  query: ListEmployeesQuery,
): EmployeeListFilters {
  return {
    search: trimToOptionalString(query.search),
    country: trimToOptionalString(query.country),
    department: trimToOptionalString(query.department),
    jobTitle: trimToOptionalString(query.jobTitle),
  };
}

function trimToOptionalString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
