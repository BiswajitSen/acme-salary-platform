import { describe, expect, it } from "vitest";

import { db } from "../../db/index.js";
import { runSeed } from "../../db/seed.js";
import { DrizzleAnalyticsRepository } from "./analytics.repository.js";
import { DrizzleCompensationRepository } from "./compensation.repository.js";

describe("DrizzleAnalyticsRepository", () => {
  const repository = new DrizzleAnalyticsRepository(db);
  const compensationRepository = new DrizzleCompensationRepository(db);

  it("returns zero when compensation history is empty", async () => {
    await expect(
      repository.countEmployeesWithLatestCompensationInCurrency("USD"),
    ).resolves.toBe(0);
  });

  it("counts employees whose latest compensation is in the requested currency", async () => {
    await runSeed(db);

    await expect(
      repository.countEmployeesWithLatestCompensationInCurrency("USD"),
    ).resolves.toBe(1);
    await expect(
      repository.countEmployeesWithLatestCompensationInCurrency("GBP"),
    ).resolves.toBe(1);
  });

  it("returns zero when no employees have latest compensation in the currency", async () => {
    await runSeed(db);

    await expect(
      repository.countEmployeesWithLatestCompensationInCurrency("EUR"),
    ).resolves.toBe(0);
  });

  it("sums latest compensation salaries for the requested currency", async () => {
    await runSeed(db);

    await expect(repository.sumLatestCompensationSalariesInCurrency("USD")).resolves.toBe(
      132_000,
    );
    await expect(repository.sumLatestCompensationSalariesInCurrency("GBP")).resolves.toBe(
      85_000,
    );
  });

  it("returns average and median salaries grouped by department", async () => {
    await runSeed(db);

    await expect(repository.findDepartmentSalaryStatisticsByCurrency("USD")).resolves.toEqual([
      {
        department: "Engineering",
        employeeCount: 1,
        averageSalary: 132_000,
        medianSalary: 132_000,
      },
    ]);
  });

  it("returns top earners ordered by salary descending", async () => {
    await runSeed(db);

    await expect(repository.findTopEarnersByCurrency("USD", 10)).resolves.toEqual([
      {
        employeeId: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        baseSalary: 132_000,
      },
    ]);
  });

  it("breaks salary ties using employee id ascending order", async () => {
    await runSeed(db);

    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E003",
      baseSalary: 132_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
      notes: null,
    });

    await expect(repository.findTopEarnersByCurrency("USD", 10)).resolves.toEqual([
      {
        employeeId: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        baseSalary: 132_000,
      },
      {
        employeeId: "E003",
        fullName: "Alice Chen",
        department: "Finance",
        baseSalary: 132_000,
      },
    ]);
  });

  it("uses the newest effective date when determining latest compensation currency", async () => {
    await runSeed(db);

    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E001",
      baseSalary: 140_000,
      currency: "EUR",
      effectiveDate: "2026-06-01",
      reason: "Market Adjustment",
      changedBy: "HR Admin",
      notes: null,
    });

    await expect(
      repository.countEmployeesWithLatestCompensationInCurrency("USD"),
    ).resolves.toBe(0);
    await expect(
      repository.countEmployeesWithLatestCompensationInCurrency("EUR"),
    ).resolves.toBe(1);
  });
});
