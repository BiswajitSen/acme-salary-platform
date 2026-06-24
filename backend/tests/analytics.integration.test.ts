import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { runSeed } from "../src/db/seed.js";

describe("GET /api/analytics/summary", () => {
  const app = createApp();

  it("returns headcount for employees with latest compensation in the currency", async () => {
    await runSeed(db);

    const response = await request(app).get("/api/analytics/summary?currency=USD");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      currency: "USD",
      headcount: 1,
      totalPayroll: 132_000,
    });
  });

  it("returns 400 for an invalid currency code", async () => {
    const response = await request(app).get("/api/analytics/summary?currency=US");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation Error");
  });
});
