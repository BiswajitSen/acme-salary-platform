import type { EmployeeSummary, PaginatedEmployeesResponse } from "@acme/shared";
import { describe, expect, it, vi } from "vitest";

import type { IEmployeeRepository, PaginatedEmployeesResult } from "../repositories/interfaces/employee.repository.js";
import { EmployeeService } from "./employee.service.js";

function createMockRepository(
  result: PaginatedEmployeesResult = { data: [], total: 0 },
): IEmployeeRepository {
  return {
    findPaginated: vi.fn().mockResolvedValue(result),
  };
}

const sampleEmployee: EmployeeSummary = {
  id: "E001",
  fullName: "Jane Doe",
  department: "Engineering",
  jobTitle: "Senior Engineer",
  country: "US",
};

describe("EmployeeService.list", () => {
  it("returns paginated employees with meta", async () => {
    const repository = createMockRepository({
      data: [sampleEmployee],
      total: 1,
    });
    const service = new EmployeeService(repository);

    const result = await service.list({});

    expect(result).toEqual({
      data: [sampleEmployee],
      meta: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    } satisfies PaginatedEmployeesResponse);
    expect(repository.findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      offset: 0,
    });
  });

  it("passes normalized pagination to the repository", async () => {
    const repository = createMockRepository();
    const service = new EmployeeService(repository);

    await service.list({ page: 2, limit: 10 });

    expect(repository.findPaginated).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      offset: 10,
    });
  });

  it("rejects invalid query params", async () => {
    const service = new EmployeeService(createMockRepository());

    await expect(service.list({ limit: 200 })).rejects.toThrow();
  });
});
