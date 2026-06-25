import type { EmployeeEmploymentStatus } from "@acme/shared";

export const EMPLOYEE_ROW_HEIGHT_PX = 64;
export const SEARCH_DEBOUNCE_MS = 300;

export const EMPLOYMENT_STATUS_FILTER_OPTIONS: EmployeeEmploymentStatus[] = [
  "ACTIVE",
  "NO_COMPENSATION",
];

export const EMPLOYMENT_STATUS_LABELS: Record<EmployeeEmploymentStatus, string> = {
  ACTIVE: "Active",
  NO_COMPENSATION: "No compensation",
};

export type DirectoryFilters = {
  search: string;
  countries: string[];
  departments: string[];
  jobTitles: string[];
  employmentStatuses: EmployeeEmploymentStatus[];
};

export const emptyDirectoryFilters: DirectoryFilters = {
  search: "",
  countries: [],
  departments: [],
  jobTitles: [],
  employmentStatuses: [],
};

export const emptyDirectoryStats = {
  total: 0,
  active: 0,
  noCompensation: 0,
  departments: 0,
};

/** Empty array means no column filter is applied (show all). */
export function isColumnFilterActive(
  selected: string[],
  options: string[],
): boolean {
  return selected.length > 0 && selected.length < options.length;
}

export function isEmploymentStatusFilterActive(
  selected: EmployeeEmploymentStatus[],
  status: EmployeeEmploymentStatus,
): boolean {
  return selected.length === 1 && selected[0] === status;
}

export function serializeFilterValues(values: string[]): string | undefined {
  return values.length > 0 ? values.join(",") : undefined;
}

export function draftFromAppliedFilter(
  applied: string[],
  options: string[],
): string[] {
  if (applied.length === 0 || applied.length === options.length) {
    return [...options];
  }

  return [...applied];
}

export function appliedFromDraftSelection(
  draft: string[],
  options: string[],
): string[] {
  if (draft.length === 0 || draft.length === options.length) {
    return [];
  }

  return [...draft];
}

export function appliedEmploymentStatusesFromDraft(
  draft: string[],
  options: EmployeeEmploymentStatus[],
): EmployeeEmploymentStatus[] {
  if (draft.length === 0 || draft.length === options.length) {
    return [];
  }

  return draft.filter((value): value is EmployeeEmploymentStatus =>
    options.includes(value as EmployeeEmploymentStatus),
  );
}
