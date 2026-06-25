import { describe, expect, it } from "vitest";

import { convertCurrencyAmount } from "@acme/shared";

import { db } from "../../db/index.js";
import { runSeed } from "../../db/seed.js";
import { DrizzleAnalyticsRepository } from "./analytics.repository.js";
import { DrizzleCompensationRepository } from "./compensation.repository.js";

describe("DrizzleAnalyticsRepository", () => {
  const repository = new DrizzleAnalyticsRepository(db);
  const compensationRepository = new DrizzleCompensationRepository(db);

  it("returns zero when compensation history is empty", async () => {
    await expect(repository.countEmployeesWithLatestCompensation()).resolves.toBe(0);
    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD"),
    ).resolves.toBe(0);
  });

  it("counts every employee with latest compensation regardless of native currency", async () => {
    await runSeed(db);

    await expect(repository.countEmployeesWithLatestCompensation()).resolves.toBe(2);
  });

  it("sums latest compensation converted into the selected display currency", async () => {
    await runSeed(db);

    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD"),
    ).resolves.toBe(238_250);
    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("GBP"),
    ).resolves.toBe(convertCurrencyAmount(132_000, "USD", "GBP") + 85_000);
  });

  it("returns average and median salaries grouped by department in display currency", async () => {
    await runSeed(db);

    await expect(
      repository.findDepartmentSalaryStatisticsInDisplayCurrency("USD"),
    ).resolves.toEqual([
      {
        department: "Engineering",
        employeeCount: 1,
        averageSalary: 132_000,
        medianSalary: 132_000,
      },
      {
        department: "HR",
        employeeCount: 1,
        averageSalary: 106_250,
        medianSalary: 106_250,
      },
    ]);
  });

  it("returns top earners ordered by converted salary descending", async () => {
    await runSeed(db);

    await expect(repository.findTopEarnersInDisplayCurrency("USD", 10)).resolves.toEqual([
      {
        employeeId: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        baseSalary: 132_000,
      },
      {
        employeeId: "E002",
        fullName: "Bob Smith",
        department: "HR",
        baseSalary: 106_250,
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

    await expect(repository.findTopEarnersInDisplayCurrency("USD", 10)).resolves.toEqual([
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
      {
        employeeId: "E002",
        fullName: "Bob Smith",
        department: "HR",
        baseSalary: 106_250,
      },
    ]);
  });

  it("converts salaries when an employee's latest compensation changes currency", async () => {
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

    await expect(repository.countEmployeesWithLatestCompensation()).resolves.toBe(2);
    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD"),
    ).resolves.toBe(convertCurrencyAmount(140_000, "EUR", "USD") + 106_250);
  });
});
