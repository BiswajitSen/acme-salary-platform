import {
  listEmployeesQuerySchema,
  type PaginatedEmployeesResponse,
} from "@acme/shared";

import { normalizePagination } from "../domain/pagination.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";

export class EmployeeService {
  constructor(private readonly employees: IEmployeeRepository) {}

  async list(query: unknown): Promise<PaginatedEmployeesResponse> {
    const parsed = listEmployeesQuerySchema.parse(query);
    const pagination = normalizePagination(parsed);
    const { data, total } = await this.employees.findPaginated(pagination);

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
}
