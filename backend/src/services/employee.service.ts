import {
  listEmployeesQuerySchema,
  type EmployeeFilterOptions,
  type PaginatedEmployeesResponse,
} from "@acme/shared";

import { extractEmployeeListFilters } from "../domain/employee-list-filters.js";
import { normalizePagination } from "../domain/pagination.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";

export class EmployeeService {
  constructor(private readonly employees: IEmployeeRepository) {}

  async listEmployees(query: unknown): Promise<PaginatedEmployeesResponse> {
    const parsed = listEmployeesQuerySchema.parse(query);
    const pagination = normalizePagination(parsed);
    const filters = extractEmployeeListFilters(parsed);
    const { data, total } = await this.employees.findPaginated({
      ...pagination,
      filters,
    });

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
      },
    };
  }

  async listEmployeeFilterOptions(): Promise<EmployeeFilterOptions> {
    return this.employees.findDistinctEmployeeFilterValues();
  }
}
