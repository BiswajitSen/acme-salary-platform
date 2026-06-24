import type { EmployeeSummary } from "@acme/shared";

export type PaginatedEmployeesQuery = {
  page: number;
  limit: number;
  offset: number;
};

export type PaginatedEmployeesResult = {
  data: EmployeeSummary[];
  total: number;
};

export interface IEmployeeRepository {
  findPaginated(query: PaginatedEmployeesQuery): Promise<PaginatedEmployeesResult>;
}
