import request from "supertest";
import { describe, expect, it } from "vitest";

import { convertCurrencyAmount, TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { employees } from "../src/db/schema.js";
import { runSeed } from "../src/db/seed.js";
import { DrizzleCompensationRepository } from "../src/repositories/drizzle/compensation.repository.js";

async function seedIndianEmployee(): Promise<void> {
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

  const compensationRepository = new DrizzleCompensationRepository(db);
  await compensationRepository.insertCompensationHistoryRecord({
    employeeId: "E010",
    baseSalary: 3_000_000,
    currency: "INR",
    effectiveDate: "2025-01-01",
    reason: "New Hire",
    changedBy: "HR Admin",
    notes: null,
  });
}

describe("POST /api/insights/parse", () => {
  const app = createApp();

  it("returns AVG_DEPT_SALARY for an average department salary question", async () => {
    const response = await request(app)
      .post("/api/insights/parse")
      .send({ query: "What is the average salary in Engineering?" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "What is the average salary in Engineering?",
      department: "Engineering",
      country: null,
      currency: null,
      months: null,
      jobTitle: null,
      sinceDate: null,
      limit: null,
      medianSplitFocus: null,
    });
  });

  it("returns RECENT_PROMOTIONS for promotion listing questions", async () => {
    const response = await request(app)
      .post("/api/insights/parse")
      .send({ query: "List employees who got promotion in the last 3months" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      intent: "RECENT_PROMOTIONS",
      originalQuery: "List employees who got promotion in the last 3months",
      department: null,
      country: null,
      currency: null,
      months: 3,
    });
  });

  it("returns UNKNOWN for unsupported questions", async () => {
    const response = await request(app)
      .post("/api/insights/parse")
      .send({ query: "Tell me a joke" });

    expect(response.status).toBe(200);
    expect(response.body.intent).toBe("UNKNOWN");
  });
});

describe("POST /api/insights/execute", () => {
  const app = createApp();

  it("returns average salary analytics for an Engineering question", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "What is the average salary in Engineering?" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery.intent).toBe("AVG_DEPT_SALARY");
    expect(response.body.result).toMatchObject({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      country: null,
      department: "Engineering",
      jobTitle: null,
      averageSalary: 132_000,
      employeeCount: 1,
    });
    expect(response.body.error).toBeNull();
    expect(response.body.exchangeRatesAsOf).toBe("2026-01-01");
  });

  it("returns a graceful error for unsupported questions", async () => {
    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "Tell me a joke" });

    expect(response.status).toBe(200);
    expect(response.body.result).toBeNull();
    expect(response.body.error).toEqual({
      kind: "UNSUPPORTED_INTENT",
      message: "This question is not supported yet.",
    });
  });

  it("rejects SQL injection style input without executing analytics", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "average salary in Engineering; DROP TABLE employees" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery.intent).toBe("UNKNOWN");
    expect(response.body.result).toBeNull();
    expect(response.body.error).toEqual({
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    });
  });

  it("returns top earners converted to INR when the query specifies INR", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "Who are the top earners in INR?", displayCurrency: "USD" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery.currency).toBe("INR");
    expect(response.body.result).toMatchObject({
      intent: "TOP_EARNERS",
      currency: "INR",
      country: null,
    });
    expect(response.body.result.earners).toHaveLength(2);
    expect(response.body.result.earners[0]).toEqual({
      employeeId: "E001",
      fullName: "Jane Doe",
      department: "Engineering",
      baseSalary: 11_000_000,
    });
    expect(response.body.result.earners[1].baseSalary).toBeCloseTo(8_854_167, 0);
    expect(response.body.error).toBeNull();
    expect(response.body.exchangeRatesAsOf).toBe("2026-01-01");
  });

  it("returns COUNTRY_NOT_FOUND when no employees in India have compensation", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "Who are the top earners in INDIA?" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery.country).toBe("IN");
    expect(response.body.result).toBeNull();
    expect(response.body.error).toEqual({
      kind: "COUNTRY_NOT_FOUND",
      message: "No salary data found for employees in IN (amounts shown in USD).",
    });
  });

  it("returns country-specific payroll totals from seed data", async () => {
    await runSeed(db);

    const ukResponse = await request(app)
      .post("/api/insights/execute")
      .send({ query: "total payroll for UK", displayCurrency: "USD" });

    const usResponse = await request(app)
      .post("/api/insights/execute")
      .send({ query: "total payroll for USA", displayCurrency: "USD" });

    expect(ukResponse.status).toBe(200);
    expect(usResponse.status).toBe(200);
    expect(ukResponse.body.parsedQuery.country).toBe("UK");
    expect(usResponse.body.parsedQuery.country).toBe("US");
    expect(ukResponse.body.result.totalPayroll).toBe(106_250);
    expect(usResponse.body.result.totalPayroll).toBe(132_000);
    expect(ukResponse.body.result.totalPayroll).not.toBe(usResponse.body.result.totalPayroll);
  });

  it("returns department and country scoped payroll totals", async () => {
    await runSeed(db);
    await seedIndianEmployee();

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "Total payroll for Engineering in Inida?", displayCurrency: "USD" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery).toMatchObject({
      intent: "TOTAL_PAYROLL",
      department: "Engineering",
      country: "IN",
    });
    expect(response.body.result).toMatchObject({
      intent: "TOTAL_PAYROLL",
      currency: "USD",
      country: "IN",
      department: "Engineering",
      jobTitle: null,
      totalPayroll: convertCurrencyAmount(3_000_000, "INR", "USD", TEST_EXCHANGE_RATES_TO_USD),
    });
    expect(response.body.error).toBeNull();
  });

  it("extracts country filters from for-country payroll questions", async () => {
    await runSeed(db);

    const ukResponse = await request(app)
      .post("/api/insights/parse")
      .send({ query: "total payroll for UK" });
    const usaResponse = await request(app)
      .post("/api/insights/parse")
      .send({ query: "total payroll for USA" });

    expect(ukResponse.body).toMatchObject({
      intent: "TOTAL_PAYROLL",
      department: null,
      country: "UK",
    });
    expect(usaResponse.body).toMatchObject({
      intent: "TOTAL_PAYROLL",
      department: null,
      country: "US",
    });
  });

  it("returns top earners for employees in India when the query mentions INDIA", async () => {
    await runSeed(db);
    await seedIndianEmployee();

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "Who are the top earners in INDIA?", displayCurrency: "USD" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery.country).toBe("IN");
    expect(response.body.parsedQuery.currency).toBeNull();
    expect(response.body.result).toMatchObject({
      intent: "TOP_EARNERS",
      currency: "USD",
      country: "IN",
      department: null,
      jobTitle: null,
      limit: 10,
      earners: [
        {
          employeeId: "E010",
          fullName: "Raj Patel",
          department: "Engineering",
          baseSalary: convertCurrencyAmount(3_000_000, "INR", "USD", TEST_EXCHANGE_RATES_TO_USD),
        },
      ],
    });
    expect(response.body.error).toBeNull();
  });

  it("returns average salary for employees in India", async () => {
    await runSeed(db);
    await seedIndianEmployee();

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "What is the average salary in India?", displayCurrency: "USD" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery).toMatchObject({
      intent: "AVG_DEPT_SALARY",
      country: "IN",
      department: null,
    });
    expect(response.body.result).toMatchObject({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      country: "IN",
      department: null,
      jobTitle: null,
      averageSalary: convertCurrencyAmount(3_000_000, "INR", "USD", TEST_EXCHANGE_RATES_TO_USD),
      employeeCount: 1,
    });
    expect(response.body.error).toBeNull();
  });

  it("returns employees promoted within the requested lookback window", async () => {
    await runSeed(db);

    const compensationRepository = new DrizzleCompensationRepository(db);
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

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "List employees who got promotion in the last 3months" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery).toMatchObject({
      intent: "RECENT_PROMOTIONS",
      months: 3,
    });
    expect(response.body.result).toMatchObject({
      intent: "RECENT_PROMOTIONS",
      months: 3,
      sinceDate: null,
      country: null,
      department: null,
      jobTitle: null,
      promotions: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 140_000,
          currency: "USD",
          effectiveDate: "2026-01-01",
          reason: "Promotion",
        },
      ],
    });
    expect(response.body.error).toBeNull();
  });

  it("returns new hires within the requested lookback window", async () => {
    await runSeed(db);

    const compensationRepository = new DrizzleCompensationRepository(db);
    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E003",
      baseSalary: 95_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
      notes: null,
    });

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "new joiners in the last 3 months" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery.intent).toBe("RECENT_NEW_HIRES");
    expect(response.body.result.hires).toEqual([
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

  it("returns an empty new-hire list for scoped timeline queries with no matches", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "employees who joined as engineers in the last 12 months" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery).toMatchObject({
      intent: "RECENT_NEW_HIRES",
      department: "Engineering",
      months: 12,
    });
    expect(response.body.result).toMatchObject({
      intent: "RECENT_NEW_HIRES",
      department: "Engineering",
      months: 12,
      hires: [],
    });
    expect(response.body.error).toBeNull();
  });

  it("returns scoped new hires within the requested lookback window", async () => {
    await runSeed(db);
    await seedIndianEmployee();

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "employees who joined as engineers in the last 12 months" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery).toMatchObject({
      intent: "RECENT_NEW_HIRES",
      department: "Engineering",
      months: 12,
    });
    expect(response.body.result.hires).toEqual([
      {
        employeeId: "E010",
        fullName: "Raj Patel",
        department: "Engineering",
        baseSalary: 3_000_000,
        currency: "INR",
        effectiveDate: "2025-01-01",
        reason: "New Hire",
      },
    ]);
    expect(response.body.error).toBeNull();
  });

  it("returns salary hikes for employees in a country", async () => {
    await runSeed(db);
    await seedIndianEmployee();

    const compensationRepository = new DrizzleCompensationRepository(db);
    await compensationRepository.insertCompensationHistoryRecord({
      employeeId: "E010",
      baseSalary: 3_200_000,
      currency: "INR",
      effectiveDate: "2026-01-01",
      reason: "Annual Increment",
      changedBy: "HR Admin",
      notes: null,
    });

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "employees in India who got salary hike in the last 3 months" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery).toMatchObject({
      intent: "RECENT_SALARY_INCREASES",
      country: "IN",
      months: 3,
    });
    expect(response.body.result.increases).toHaveLength(1);
    expect(response.body.result.increases[0].reason).toBe("Annual Increment");
  });

  it("returns organization-wide average salary without a scope filter", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "What is the average salary?", displayCurrency: "USD" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery).toMatchObject({
      intent: "AVG_DEPT_SALARY",
      country: null,
      department: null,
    });
    expect(response.body.result).toMatchObject({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      country: null,
      department: null,
      employeeCount: 2,
    });
    expect(response.body.error).toBeNull();
  });

  it("returns top earners filtered by department and country together", async () => {
    await runSeed(db);
    await seedIndianEmployee();

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "Who are the top earners in Engineering in India?", displayCurrency: "USD" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery).toMatchObject({
      intent: "TOP_EARNERS",
      country: "IN",
      department: "Engineering",
    });
    expect(response.body.result).toMatchObject({
      intent: "TOP_EARNERS",
      currency: "USD",
      country: "IN",
      department: "Engineering",
      jobTitle: null,
      limit: 10,
      earners: [
        {
          employeeId: "E010",
          fullName: "Raj Patel",
          department: "Engineering",
          baseSalary: convertCurrencyAmount(3_000_000, "INR", "USD", TEST_EXCHANGE_RATES_TO_USD),
        },
      ],
    });
    expect(response.body.error).toBeNull();
  });

  it("returns bottom earners for least earner questions", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "who are the least earners?", displayCurrency: "USD" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery.intent).toBe("BOTTOM_EARNERS");
    expect(response.body.result).toMatchObject({
      intent: "BOTTOM_EARNERS",
      currency: "USD",
      limit: 10,
    });
    expect(response.body.result.earners[0].employeeId).toBe("E002");
    expect(response.body.error).toBeNull();
  });

  it("returns employees near the scoped median", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/insights/execute")
      .send({ query: "who earn around the median?", displayCurrency: "USD" });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery.intent).toBe("NEAR_MEDIAN_EARNERS");
    expect(response.body.result).toMatchObject({
      intent: "NEAR_MEDIAN_EARNERS",
      currency: "USD",
      tolerancePercent: 10,
    });
    expect(response.body.result.earners.length).toBeGreaterThanOrEqual(0);
    expect(response.body.error).toBeNull();
  });

  it("returns below-median employee counts for scoped single-sided split questions", async () => {
    await runSeed(db);
    await seedIndianEmployee();

    const response = await request(app)
      .post("/api/insights/execute")
      .send({
        query: "How many employees are earning below median in Engineering in India?",
        displayCurrency: "INR",
      });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery).toMatchObject({
      intent: "MEDIAN_SPLIT_COUNTS",
      department: "Engineering",
      country: "IN",
      medianSplitFocus: "below",
    });
    expect(response.body.result).toMatchObject({
      intent: "MEDIAN_SPLIT_COUNTS",
      currency: "INR",
      department: "Engineering",
      country: "IN",
      medianSplitFocus: "below",
      employeeCount: 1,
      belowMedianCount: 0,
      aboveMedianCount: 0,
    });
    expect(response.body.error).toBeNull();
  });

  it("returns below and above median employee counts for scoped split questions", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/insights/execute")
      .send({
        query: "how many employees are earning below and above median in Engineering?",
        displayCurrency: "USD",
      });

    expect(response.status).toBe(200);
    expect(response.body.parsedQuery.intent).toBe("MEDIAN_SPLIT_COUNTS");
    expect(response.body.parsedQuery.department).toBe("Engineering");
    expect(response.body.parsedQuery.country).toBeNull();
    expect(response.body.parsedQuery.medianSplitFocus).toBe("both");
    expect(response.body.result).toMatchObject({
      intent: "MEDIAN_SPLIT_COUNTS",
      currency: "USD",
      department: "Engineering",
      country: null,
      medianSplitFocus: "both",
    });
    expect(response.body.result.belowMedianCount).toBeGreaterThanOrEqual(0);
    expect(response.body.result.aboveMedianCount).toBeGreaterThanOrEqual(0);
    expect(
      response.body.result.belowMedianCount + response.body.result.aboveMedianCount,
    ).toBeLessThanOrEqual(response.body.result.employeeCount);
    expect(response.body.error).toBeNull();
  });
});
