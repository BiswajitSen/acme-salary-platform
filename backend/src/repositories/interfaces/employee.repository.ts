import type { EmployeeSummary } from "@acme/shared";

import type { EmployeeListFilters } from "../../domain/employee-list-filters.js";

export type PaginatedEmployeesQuery = {
  page: number;
  limit: number;
  offset: number;
  filters: EmployeeListFilters;
};

export type PaginatedEmployeesResult = {
  data: EmployeeSummary[];
  total: number;
};

export interface IEmployeeRepository {
  findPaginated(query: PaginatedEmployeesQuery): Promise<PaginatedEmployeesResult>;
  findDistinctFilterValues(): Promise<{
    countries: string[];
    departments: string[];
    jobTitles: string[];
  }>;
}
