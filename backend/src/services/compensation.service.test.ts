import { describe, expect, it, vi } from "vitest";

import type { CompensationHistoryRecord } from "../domain/compensation.types.js";
import { AppError } from "../lib/errors.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";
import { CompensationService } from "./compensation.service.js";

const sampleEmployee = {
  id: "E001",
  fullName: "Jane Doe",
  department: "Engineering",
  jobTitle: "Senior Engineer",
  country: "US",
};

const existingHistory: CompensationHistoryRecord[] = [
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
];

function createMockEmployeeRepository(
  employee: typeof sampleEmployee | null = sampleEmployee,
): IEmployeeRepository {
  return {
    findPaginated: vi.fn(),
    findEmployeeById: vi.fn().mockResolvedValue(employee),
    findDistinctEmployeeFilterValues: vi.fn(),
    upsertManyEmployees: vi.fn(),
  };
}

function createMockCompensationRepository(
  history: CompensationHistoryRecord[] = existingHistory,
): ICompensationRepository {
  const records = [...history];

  return {
    findCompensationHistoryByEmployeeId: vi.fn().mockImplementation(async () => [...records]),
    insertCompensationHistoryRecord: vi.fn().mockImplementation(async (record) => {
      const insertedRecord: CompensationHistoryRecord = {
        id: records.length + 1,
        createdAt: "2026-01-02T10:00:00.000Z",
        ...record,
      };
      records.push(insertedRecord);
      return insertedRecord;
    }),
  };
}

describe("CompensationService.recordCompensationChange", () => {
  it("inserts a new history row without updating existing rows", async () => {
    const compensationRepository = createMockCompensationRepository();
    const service = new CompensationService(
      createMockEmployeeRepository(),
      compensationRepository,
    );

    await service.recordCompensationChange("E001", {
      baseSalary: 132_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "Annual Increment",
      changedBy: "HR Admin",
      notes: "Merit increase",
    });

    expect(compensationRepository.insertCompensationHistoryRecord).toHaveBeenCalledOnce();
    expect(await compensationRepository.findCompensationHistoryByEmployeeId("E001")).toHaveLength(
      2,
    );
  });

  it("returns the newest timeline entry after recording a change", async () => {
    const service = new CompensationService(
      createMockEmployeeRepository(),
      createMockCompensationRepository(),
    );

    const response = await service.recordCompensationChange("E001", {
      baseSalary: 132_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "Annual Increment",
      changedBy: "HR Admin",
    });

    expect(response.entry).toMatchObject({
      baseSalary: 132_000,
      previousSalary: 120_000,
      reason: "Annual Increment",
    });
  });

  it("rejects negative base salary values", async () => {
    const service = new CompensationService(
      createMockEmployeeRepository(),
      createMockCompensationRepository(),
    );

    await expect(
      service.recordCompensationChange("E001", {
        baseSalary: -1,
        currency: "USD",
        effectiveDate: "2026-01-01",
        reason: "Correction",
        changedBy: "HR Admin",
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid currency codes", async () => {
    const service = new CompensationService(
      createMockEmployeeRepository(),
      createMockCompensationRepository(),
    );

    await expect(
      service.recordCompensationChange("E001", {
        baseSalary: 100_000,
        currency: "US",
        effectiveDate: "2026-01-01",
        reason: "Correction",
        changedBy: "HR Admin",
      }),
    ).rejects.toThrow();
  });

  it("returns 404 when the employee does not exist", async () => {
    const service = new CompensationService(
      createMockEmployeeRepository(null),
      createMockCompensationRepository(),
    );

    await expect(
      service.recordCompensationChange("E404", {
        baseSalary: 100_000,
        currency: "USD",
        effectiveDate: "2026-01-01",
        reason: "Correction",
        changedBy: "HR Admin",
      }),
    ).rejects.toEqual(new AppError(404, "Employee E404 not found"));
  });

  it("fails when the recorded change cannot be loaded into the timeline", async () => {
    const compensationRepository: ICompensationRepository = {
      findCompensationHistoryByEmployeeId: vi.fn().mockResolvedValue([]),
      insertCompensationHistoryRecord: vi.fn().mockResolvedValue({
        id: 99,
        employeeId: "E001",
        baseSalary: 132_000,
        currency: "USD",
        effectiveDate: "2026-01-01",
        reason: "Annual Increment",
        changedBy: "HR Admin",
        notes: null,
        createdAt: "2026-01-02T10:00:00.000Z",
      }),
    };
    const service = new CompensationService(
      createMockEmployeeRepository(),
      compensationRepository,
    );

    await expect(
      service.recordCompensationChange("E001", {
        baseSalary: 132_000,
        currency: "USD",
        effectiveDate: "2026-01-01",
        reason: "Annual Increment",
        changedBy: "HR Admin",
      }),
    ).rejects.toEqual(new AppError(500, "Failed to load recorded compensation change"));
  });
});

describe("ICompensationRepository immutability", () => {
  it("exposes insert only and has no update or delete methods", () => {
    const compensationRepository = createMockCompensationRepository();

    expect(compensationRepository.insertCompensationHistoryRecord).toBeDefined();
    expect("updateCompensationHistoryRecord" in compensationRepository).toBe(false);
    expect("deleteCompensationHistoryRecord" in compensationRepository).toBe(false);
  });
});
