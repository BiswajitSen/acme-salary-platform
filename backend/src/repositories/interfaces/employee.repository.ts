import type { EmployeeSummary } from "@acme/shared";

import type { EmployeeListFilters } from "../../domain/employee-list-filters.js";
import type { EmployeeSpreadsheetRow, EmployeeImportResult } from "../../domain/employee-import.types.js";

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
  findEmployeeById(id: string): Promise<EmployeeSummary | null>;
  findExistingEmployeeIds(employeeIds: string[]): Promise<Set<string>>;
  findDistinctEmployeeFilterValues(): Promise<{
    countries: string[];
    departments: string[];
    jobTitles: string[];
  }>;
  upsertManyEmployees(
    employees: EmployeeSpreadsheetRow[],
  ): Promise<EmployeeImportResult>;
}
