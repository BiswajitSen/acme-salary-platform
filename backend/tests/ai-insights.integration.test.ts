import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { runSeed } from "../src/db/seed.js";

describe("POST /api/insights/parse", () => {
  const app = createApp();

  it("returns AVG_DEPT_SALARY for an average department salary question", async () => {
    const response = await request(app)
      .post("/api/insights/parse")
      .send({ query: "What is the average salary in Engineering?" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "What is the average salary in Engineering?",
      department: "Engineering",
      currency: null,
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
    expect(response.body.result).toEqual({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      department: "Engineering",
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
});
