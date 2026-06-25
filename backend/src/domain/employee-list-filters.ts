import {
  EMPLOYEE_EMPLOYMENT_STATUSES,
  type EmployeeEmploymentStatus,
  type ListEmployeesQuery,
} from "@acme/shared";

export type EmployeeListFilters = {
  search?: string;
  countries?: string[];
  departments?: string[];
  jobTitles?: string[];
  employmentStatuses?: EmployeeEmploymentStatus[];
};

export function parseMultiValueFilter(
  value: string | undefined,
): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const values = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return values.length > 0 ? values : undefined;
}

export function parseEmploymentStatusFilter(
  value: string | undefined,
): EmployeeEmploymentStatus[] | undefined {
  const values = parseMultiValueFilter(value);

  if (!values) {
    return undefined;
  }

  const allowed = new Set<string>(EMPLOYEE_EMPLOYMENT_STATUSES);
  const statuses = values.filter(
    (value): value is EmployeeEmploymentStatus => allowed.has(value),
  );

  return statuses.length > 0 ? statuses : undefined;
}

export function extractEmployeeListFilters(
  query: Pick<
    ListEmployeesQuery,
    "search" | "country" | "department" | "jobTitle" | "employmentStatus"
  >,
): EmployeeListFilters {
  return {
    search: trimToOptionalString(query.search),
    countries: parseMultiValueFilter(query.country),
    departments: parseMultiValueFilter(query.department),
    jobTitles: parseMultiValueFilter(query.jobTitle),
    employmentStatuses: parseEmploymentStatusFilter(query.employmentStatus),
  };
}

function trimToOptionalString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
