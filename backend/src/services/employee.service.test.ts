import type { EmployeeSummary } from "@acme/shared";
import { describe, expect, it, vi } from "vitest";

import type { CompensationHistoryRecord } from "../domain/compensation.types.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type {
  IEmployeeRepository,
  PaginatedEmployeesResult,
} from "../repositories/interfaces/employee.repository.js";
import { AppError } from "../lib/errors.js";
import { EmployeeService } from "./employee.service.js";

function createMockCompensationRepository(
  history: CompensationHistoryRecord[] = [],
): ICompensationRepository {
  return {
    findCompensationHistoryByEmployeeId: vi.fn().mockResolvedValue(history),
    findCompensationHistoryByEmployeeIds: vi.fn().mockResolvedValue(new Map()),
    insertCompensationHistoryRecord: vi.fn(),
    insertManyCompensationHistoryRecords: vi.fn(),
    findEmployeeIdsWithCompensationHistory: vi.fn().mockResolvedValue(new Set()),
  };
}

function createMockRepository(
  result: PaginatedEmployeesResult = {
    data: [],
    total: 0,
    stats: { total: 0, active: 0, noCompensation: 0, departments: 0 },
  },
): IEmployeeRepository {
  return {
    findPaginated: vi.fn().mockResolvedValue(result),
    findEmployeeById: vi.fn(),
    findDistinctEmployeeFilterValues: vi.fn().mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    }),
    upsertManyEmployees: vi.fn(),
    insertEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
  };
}

const sampleEmployee: EmployeeSummary = {
  id: "E001",
  fullName: "Jane Doe",
  department: "Engineering",
  jobTitle: "Senior Engineer",
  country: "US",
  baseSalary: 132_000,
  currency: "USD",
  employmentStatus: "ACTIVE",
};

const sampleStats = {
  total: 1,
  active: 1,
  noCompensation: 0,
  departments: 1,
};

const sampleHistory: CompensationHistoryRecord[] = [
  {
    id: 1,
    employeeId: "E001",
    baseSalary: 120_000,
    currency: "USD",
    effectiveDate: "2024-01-01",
    reason: "New Hire",
    changedBy: "HR Admin",
    notes: null,
    createdAt: "2024-01-02T10:00:00.000Z",
  },
  {
    id: 2,
    employeeId: "E001",
    baseSalary: 132_000,
    currency: "USD",
    effectiveDate: "2025-01-01",
    reason: "Annual Increment",
    changedBy: "HR Admin",
    notes: "Merit increase",
    createdAt: "2025-01-02T10:00:00.000Z",
  },
];

function createService(
  repository: IEmployeeRepository,
  compensation: ICompensationRepository = createMockCompensationRepository(),
) {
  return new EmployeeService(repository, compensation);
}

describe("EmployeeService.listEmployees", () => {
  it("returns paginated employees with meta", async () => {
    const repository = createMockRepository({
      data: [sampleEmployee],
      total: 1,
      stats: sampleStats,
    });
    const service = createService(repository);

    const result = await service.listEmployees({});

    expect(result).toEqual({
      data: [sampleEmployee],
      meta: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
      stats: sampleStats,
    });
    expect(repository.findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      offset: 0,
      filters: {},
    });
  });

  it("returns zero total pages when no employees match", async () => {
    const service = createService(createMockRepository({ data: [], total: 0 }));

    const result = await service.listEmployees({});

    expect(result.meta.totalPages).toBe(0);
  });

  it("forwards search and filters to the repository", async () => {
    const repository = createMockRepository();
    const service = createService(repository);

    await service.listEmployees({
      page: 2,
      limit: 10,
      search: "Jane",
      country: "US",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      employmentStatus: "NO_COMPENSATION",
    });

    expect(repository.findPaginated).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      offset: 10,
      filters: {
        search: "Jane",
        countries: ["US"],
        departments: ["Engineering"],
        jobTitles: ["Senior Engineer"],
        employmentStatuses: ["NO_COMPENSATION"],
      },
    });
  });

  it("rejects invalid query params", async () => {
    const service = createService(createMockRepository());

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
    const service = createService(repository);

    await expect(service.listEmployeeFilterOptions()).resolves.toEqual({
      countries: ["US"],
      departments: ["Engineering"],
      jobTitles: ["Senior Engineer"],
    });
  });
});

describe("EmployeeService.getEmployeeProfile", () => {
  it("returns an employee profile with current compensation", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(sampleEmployee);
    const compensation = createMockCompensationRepository(sampleHistory);
    const service = createService(repository, compensation);

    await expect(service.getEmployeeProfile("E001")).resolves.toEqual({
      ...sampleEmployee,
      currentCompensation: {
        baseSalary: 132_000,
        currency: "USD",
        effectiveDate: "2025-01-01",
        reason: "Annual Increment",
        changedBy: "HR Admin",
        lastUpdated: "2025-01-02T10:00:00.000Z",
      },
    });
  });

  it("returns null current compensation when history is empty", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(sampleEmployee);
    const service = createService(repository);

    await expect(service.getEmployeeProfile("E001")).resolves.toEqual({
      ...sampleEmployee,
      currentCompensation: null,
    });
  });

  it("throws a 404 when the employee does not exist", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(null);
    const service = createService(repository);

    await expect(service.getEmployeeProfile("E404")).rejects.toEqual(
      new AppError(404, "Employee E404 not found"),
    );
  });
});

describe("EmployeeService.listEmployeeCompensationHistory", () => {
  it("returns a newest-first compensation timeline", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(sampleEmployee);
    const compensation = createMockCompensationRepository(sampleHistory);
    const service = createService(repository, compensation);

    const result = await service.listEmployeeCompensationHistory("E001");

    expect(result.employeeId).toBe("E001");
    expect(result.entries.map((entry) => entry.id)).toEqual([2, 1]);
    expect(result.entries[0]?.previousSalary).toBe(120_000);
  });

  it("throws a 404 when the employee does not exist", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(null);
    const service = createService(repository);

    await expect(service.listEmployeeCompensationHistory("E404")).rejects.toEqual(
      new AppError(404, "Employee E404 not found"),
    );
  });
});

describe("EmployeeService.createEmployee", () => {
  it("creates a new employee and returns the profile", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "E010",
        fullName: "New Hire",
        department: "Engineering",
        jobTitle: "Engineer",
        country: "US",
        baseSalary: null,
        currency: null,
        employmentStatus: "NO_COMPENSATION",
      });
    const service = createService(repository);

    await expect(
      service.createEmployee({
        id: "E010",
        fullName: "New Hire",
        department: "Engineering",
        jobTitle: "Engineer",
        country: "us",
      }),
    ).resolves.toMatchObject({
      id: "E010",
      fullName: "New Hire",
      currentCompensation: null,
    });
    expect(repository.insertEmployee).toHaveBeenCalledWith({
      id: "E010",
      fullName: "New Hire",
      department: "Engineering",
      jobTitle: "Engineer",
      country: "US",
    });
  });

  it("rejects duplicate employee ids", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(sampleEmployee);
    const service = createService(repository);

    await expect(
      service.createEmployee({
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
      }),
    ).rejects.toEqual(new AppError(409, "Employee E001 already exists"));
  });
});

describe("EmployeeService.updateEmployee", () => {
  it("updates an existing employee and returns the profile", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById)
      .mockResolvedValueOnce(sampleEmployee)
      .mockResolvedValueOnce({
        ...sampleEmployee,
        fullName: "Jane Smith",
      });
    vi.mocked(repository.updateEmployee).mockResolvedValue({
      ...sampleEmployee,
      fullName: "Jane Smith",
    });
    const service = createService(repository);

    await expect(
      service.updateEmployee("E001", {
        fullName: "Jane Smith",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
      }),
    ).resolves.toMatchObject({ fullName: "Jane Smith" });
  });

  it("throws a 404 when the employee does not exist", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(null);
    const service = createService(repository);

    await expect(
      service.updateEmployee("E404", {
        fullName: "Missing",
        department: "Engineering",
        jobTitle: "Engineer",
        country: "US",
      }),
    ).rejects.toEqual(new AppError(404, "Employee E404 not found"));
  });
});

describe("EmployeeService.deleteEmployee", () => {
  it("deletes an employee without compensation history", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(sampleEmployee);
    const service = createService(repository);

    await expect(service.deleteEmployee("E001")).resolves.toBeUndefined();
    expect(repository.deleteEmployee).toHaveBeenCalledWith("E001");
  });

  it("rejects delete when compensation history exists", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(sampleEmployee);
    const compensation = createMockCompensationRepository(sampleHistory);
    const service = createService(repository, compensation);

    await expect(service.deleteEmployee("E001")).rejects.toEqual(
      new AppError(409, "Cannot delete an employee with compensation history"),
    );
    expect(repository.deleteEmployee).not.toHaveBeenCalled();
  });

  it("throws a 404 when the employee does not exist", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findEmployeeById).mockResolvedValue(null);
    const service = createService(repository);

    await expect(service.deleteEmployee("E404")).rejects.toEqual(
      new AppError(404, "Employee E404 not found"),
    );
  });
});
