import request from "supertest";
import { describe, expect, it } from "vitest";

import { ANALYTICS_DISPLAY_CURRENCIES } from "@acme/shared";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { runSeed } from "../src/db/seed.js";

describe("GET /api/analytics/summary", () => {
  const app = createApp();

  it("returns supported display currencies for HR to switch between", async () => {
    const response = await request(app).get("/api/analytics/currencies");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ currencies: [...ANALYTICS_DISPLAY_CURRENCIES] });
  });

  it("returns org-wide headcount with payroll converted to the display currency", async () => {
    await runSeed(db);

    const response = await request(app).get("/api/analytics/summary?currency=USD");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      currency: "USD",
      headcount: 2,
      totalPayroll: 238_250,
    });
  });

  it("returns 400 for an invalid currency code", async () => {
    const response = await request(app).get("/api/analytics/summary?currency=US");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation Error");
  });
});

describe("GET /api/analytics/departments", () => {
  const app = createApp();

  it("returns average and median salaries grouped by department in display currency", async () => {
    await runSeed(db);

    const response = await request(app).get("/api/analytics/departments?currency=USD");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      currency: "USD",
      departments: [
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
      ],
    });
  });
});

describe("GET /api/analytics/top-earners", () => {
  const app = createApp();

  it("returns the highest paid employees converted to the display currency", async () => {
    await runSeed(db);

    const response = await request(app).get("/api/analytics/top-earners?currency=USD");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      currency: "USD",
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
});
