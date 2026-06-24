import type { EmployeeSummary } from "@acme/shared";
import { describe, expect, it, vi } from "vitest";

import type {
  IEmployeeRepository,
  PaginatedEmployeesResult,
} from "../repositories/interfaces/employee.repository.js";
import { EmployeeService } from "./employee.service.js";

function createMockRepository(
  result: PaginatedEmployeesResult = { data: [], total: 0 },
): IEmployeeRepository {
  return {
    findPaginated: vi.fn().mockResolvedValue(result),
    findDistinctEmployeeFilterValues: vi.fn().mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    }),
    upsertManyEmployees: vi.fn(),
  };
}

const sampleEmployee: EmployeeSummary = {
  id: "E001",
  fullName: "Jane Doe",
  department: "Engineering",
  jobTitle: "Senior Engineer",
  country: "US",
};

describe("EmployeeService.listEmployees", () => {
  it("returns paginated employees with meta", async () => {
    const repository = createMockRepository({
      data: [sampleEmployee],
      total: 1,
    });
    const service = new EmployeeService(repository);

    const result = await service.listEmployees({});

    expect(result).toEqual({
      data: [sampleEmployee],
      meta: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    });
    expect(repository.findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      offset: 0,
      filters: {},
    });
  });

  it("returns zero total pages when no employees match", async () => {
    const service = new EmployeeService(createMockRepository({ data: [], total: 0 }));

    const result = await service.listEmployees({});

    expect(result.meta.totalPages).toBe(0);
  });

  it("forwards search and filters to the repository", async () => {
    const repository = createMockRepository();
    const service = new EmployeeService(repository);

    await service.listEmployees({
      page: 2,
      limit: 10,
      search: "Jane",
      country: "US",
      department: "Engineering",
      jobTitle: "Senior Engineer",
    });

    expect(repository.findPaginated).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      offset: 10,
      filters: {
        search: "Jane",
        country: "US",
        department: "Engineering",
        jobTitle: "Senior Engineer",
      },
    });
  });

  it("rejects invalid query params", async () => {
    const service = new EmployeeService(createMockRepository());

    await expect(service.listEmployees({ limit: 200 })).rejects.toThrow();
  });
});

describe("EmployeeService.listEmployeeFilterOptions", () => {
  it("returns distinct filter values from the repository", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findDistinctEmployeeFilterValues).mockResolvedValue({
      countries: ["US"],
      departments: ["Engineering"],
      jobTitles: ["Senior Engineer"],
    });
    const service = new EmployeeService(repository);

    await expect(service.listEmployeeFilterOptions()).resolves.toEqual({
      countries: ["US"],
      departments: ["Engineering"],
      jobTitles: ["Senior Engineer"],
    });
  });
});
