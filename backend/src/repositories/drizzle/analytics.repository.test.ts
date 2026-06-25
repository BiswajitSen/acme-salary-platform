import { describe, expect, it } from "vitest";

import { convertCurrencyAmount, TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

import { db } from "../../db/index.js";
import { employees } from "../../db/schema.js";
import { runSeed } from "../../db/seed.js";
import { DrizzleAnalyticsRepository } from "./analytics.repository.js";
import { DrizzleCompensationRepository } from "./compensation.repository.js";

const testRates = TEST_EXCHANGE_RATES_TO_USD;

describe("DrizzleAnalyticsRepository", () => {
  const repository = new DrizzleAnalyticsRepository(db);
  const compensationRepository = new DrizzleCompensationRepository(db);

  it("returns zero when compensation history is empty", async () => {
    await expect(repository.countEmployeesWithLatestCompensation()).resolves.toBe(0);
    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD", testRates),
    ).resolves.toBe(0);
  });

  it("counts every employee with latest compensation regardless of native currency", async () => {
    await runSeed(db);

    await expect(repository.countEmployeesWithLatestCompensation()).resolves.toBe(2);
  });

  it("sums latest compensation converted into the selected display currency", async () => {
    await runSeed(db);

    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD", testRates),
    ).resolves.toBe(238_250);
    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("GBP", testRates),
    ).resolves.toBe(convertCurrencyAmount(132_000, "USD", "GBP", testRates) + 85_000);
  });

  it("returns average and median salaries grouped by department in display currency", async () => {
    await runSeed(db);

    await expect(
      repository.findDepartmentSalaryStatisticsInDisplayCurrency("USD", testRates),
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

  it("returns average salary statistics for employees in a country", async () => {
    await runSeed(db);

    await db
      .insert(employees)
      .values({
        id: "E010",
        fullName: "Raj Patel",
        department: "Engineering",
        jobTitle: "Staff Engineer",
        country: "IN",
      })
      .onConflictDoNothing();

    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E010",
      baseSalary: 3_000_000,
      currency: "INR",
      effectiveDate: "2025-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
      notes: null,
    });

    await expect(
      repository.findSalaryStatisticsInDisplayCurrency("USD", testRates, { country: "IN" }),
    ).resolves.toEqual({
      employeeCount: 1,
      averageSalary: convertCurrencyAmount(3_000_000, "INR", "USD", testRates),
      medianSalary: convertCurrencyAmount(3_000_000, "INR", "USD", testRates),
    });
  });

  it("returns payroll totals filtered by department and country together", async () => {
    await runSeed(db);

    await db
      .insert(employees)
      .values({
        id: "E010",
        fullName: "Raj Patel",
        department: "Engineering",
        jobTitle: "Staff Engineer",
        country: "IN",
      })
      .onConflictDoNothing();

    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E010",
      baseSalary: 3_000_000,
      currency: "INR",
      effectiveDate: "2025-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
      notes: null,
    });

    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD", testRates, {
        country: "IN",
        department: "Engineering",
      }),
    ).resolves.toBe(convertCurrencyAmount(3_000_000, "INR", "USD", testRates));
    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD", testRates, {
        country: "IN",
        department: "HR",
      }),
    ).resolves.toBe(0);
  });

  it("returns payroll totals filtered by employee country", async () => {
    await runSeed(db);

    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD", testRates, { country: "UK" }),
    ).resolves.toBe(106_250);
    await expect(
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD", testRates, { country: "US" }),
    ).resolves.toBe(132_000);
    await expect(repository.countEmployeesWithLatestCompensation({ country: "UK" })).resolves.toBe(1);
    await expect(repository.countEmployeesWithLatestCompensation({ country: "US" })).resolves.toBe(1);
  });

  it("returns top earners filtered by country when requested", async () => {
    await runSeed(db);

    await db
      .insert(employees)
      .values({
        id: "E010",
        fullName: "Raj Patel",
        department: "Engineering",
        jobTitle: "Staff Engineer",
        country: "IN",
      })
      .onConflictDoNothing();

    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E010",
      baseSalary: 3_000_000,
      currency: "INR",
      effectiveDate: "2025-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
      notes: null,
    });

    await expect(
      repository.findTopEarnersInDisplayCurrency("USD", testRates, 10, { country: "IN" }),
    ).resolves.toEqual([
      {
        employeeId: "E010",
        fullName: "Raj Patel",
        department: "Engineering",
        baseSalary: convertCurrencyAmount(3_000_000, "INR", "USD", testRates),
      },
    ]);

    await expect(
      repository.findTopEarnersInDisplayCurrency("USD", testRates, 10, {
        country: "IN",
        department: "Engineering",
      }),
    ).resolves.toEqual([
      {
        employeeId: "E010",
        fullName: "Raj Patel",
        department: "Engineering",
        baseSalary: convertCurrencyAmount(3_000_000, "INR", "USD", testRates),
      },
    ]);
  });

  it("returns top earners ordered by converted salary descending", async () => {
    await runSeed(db);

    await expect(repository.findTopEarnersInDisplayCurrency("USD", testRates, 10)).resolves.toEqual([
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

    await expect(repository.findTopEarnersInDisplayCurrency("USD", testRates, 10)).resolves.toEqual([
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
      repository.sumLatestCompensationSalariesInDisplayCurrency("USD", testRates),
    ).resolves.toBe(convertCurrencyAmount(140_000, "EUR", "USD", testRates) + 106_250);
  });

  it("returns bottom earners ordered by converted salary ascending", async () => {
    await runSeed(db);

    await expect(repository.findBottomEarnersInDisplayCurrency("USD", testRates, 10)).resolves.toEqual([
      {
        employeeId: "E002",
        fullName: "Bob Smith",
        department: "HR",
        baseSalary: 106_250,
      },
      {
        employeeId: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        baseSalary: 132_000,
      },
    ]);
  });

  it("returns employees within the near-median salary band", async () => {
    await runSeed(db);

    await expect(
      repository.findNearMedianEarnersInDisplayCurrency("USD", testRates, 15),
    ).resolves.toEqual({
      medianSalary: 119_125,
      earners: [
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
      ],
    });
  });

  it("returns below and above median employee counts for a scoped cohort", async () => {
    await runSeed(db);

    const result = await repository.findMedianSplitCountsInDisplayCurrency(
      "USD",
      testRates,
      { department: "Engineering" },
    );

    expect(result.employeeCount).toBeGreaterThan(0);
    expect(result.belowMedianCount + result.aboveMedianCount).toBeLessThanOrEqual(
      result.employeeCount,
    );
    expect(result.medianSalary).toBeGreaterThan(0);
  });

  it("returns promotion records within the requested lookback window", async () => {
    await runSeed(db);

    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E001",
      baseSalary: 140_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "Promotion",
      changedBy: "HR Admin",
      notes: null,
    });
    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E002",
      baseSalary: 90_000,
      currency: "GBP",
      effectiveDate: "2024-06-15",
      reason: "Promotion",
      changedBy: "HR Admin",
      notes: null,
    });

    await expect(
      repository.findRecentPromotions("2026-01-01", { months: 3, sinceDate: null }),
    ).resolves.toEqual([
      {
        employeeId: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        baseSalary: 140_000,
        currency: "USD",
        effectiveDate: "2026-01-01",
        reason: "Promotion",
      },
    ]);
  });

  it("returns new hire records within the requested lookback window", async () => {
    await runSeed(db);

    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E003",
      baseSalary: 95_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
      notes: null,
    });

    await expect(
      repository.findRecentCompensationEvents(
        "2026-01-01",
        { months: 3, sinceDate: null },
        ["New Hire"],
      ),
    ).resolves.toEqual([
      {
        employeeId: "E003",
        fullName: "Alice Chen",
        department: "Finance",
        baseSalary: 95_000,
        currency: "USD",
        effectiveDate: "2026-01-01",
        reason: "New Hire",
      },
    ]);
  });
});
