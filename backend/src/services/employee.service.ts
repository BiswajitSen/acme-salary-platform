import {
  listEmployeesQuerySchema,
  type EmployeeCompensationHistoryResponse,
  type EmployeeFilterOptions,
  type EmployeeProfileResponse,
  type PaginatedEmployeesResponse,
} from "@acme/shared";

import {
  buildCompensationTimeline,
  selectCurrentCompensation,
} from "../domain/compensation-timeline.js";
import { extractEmployeeListFilters } from "../domain/employee-list-filters.js";
import { normalizePagination } from "../domain/pagination.js";
import { AppError } from "../lib/errors.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";

export class EmployeeService {
  constructor(
    private readonly employees: IEmployeeRepository,
    private readonly compensation: ICompensationRepository,
  ) {}

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

  async getEmployeeProfile(employeeId: string): Promise<EmployeeProfileResponse> {
    const employee = await this.employees.findEmployeeById(employeeId);

    if (!employee) {
      throw new AppError(404, `Employee ${employeeId} not found`);
    }

    const history =
      await this.compensation.findCompensationHistoryByEmployeeId(employeeId);

    return {
      ...employee,
      currentCompensation: selectCurrentCompensation(history),
    };
  }

  async listEmployeeCompensationHistory(
    employeeId: string,
  ): Promise<EmployeeCompensationHistoryResponse> {
    const employee = await this.employees.findEmployeeById(employeeId);

    if (!employee) {
      throw new AppError(404, `Employee ${employeeId} not found`);
    }

    const history =
      await this.compensation.findCompensationHistoryByEmployeeId(employeeId);

    return {
      employeeId,
      entries: buildCompensationTimeline(history),
    };
  }
}
