import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { runSeed } from "../src/db/seed.js";

describe("Record compensation change API", () => {
  const app = createApp();

  it("creates a new compensation history row for an employee", async () => {
    await runSeed(db);

    const response = await request(app).post("/api/employees/E003/compensation").send({
      baseSalary: 95_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
      notes: "Initial offer",
    });

    expect(response.status).toBe(201);
    expect(response.body.entry).toMatchObject({
      baseSalary: 95_000,
      currency: "USD",
      reason: "New Hire",
      previousSalary: null,
      previousCurrency: null,
    });

    const historyResponse = await request(app).get("/api/employees/E003/compensation");
    expect(historyResponse.body.entries).toHaveLength(1);
  });

  it("returns 404 when recording a change for an unknown employee", async () => {
    const response = await request(app).post("/api/employees/E404/compensation").send({
      baseSalary: 95_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Employee E404 not found");
  });

  it("rejects invalid compensation change payloads", async () => {
    await runSeed(db);

    const response = await request(app).post("/api/employees/E001/compensation").send({
      baseSalary: -1,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "Correction",
      changedBy: "HR Admin",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation Error");
  });

  it("appends a change without mutating existing history rows", async () => {
    await runSeed(db);

    const beforeHistory = await request(app).get("/api/employees/E001/compensation");
    const originalEntryCount = beforeHistory.body.entries.length;

    await request(app).post("/api/employees/E001/compensation").send({
      baseSalary: 140_000,
      currency: "USD",
      effectiveDate: "2026-06-01",
      reason: "Promotion",
      changedBy: "HR Admin",
    });

    const afterHistory = await request(app).get("/api/employees/E001/compensation");
    expect(afterHistory.body.entries).toHaveLength(originalEntryCount + 1);
    expect(afterHistory.body.entries[0]?.baseSalary).toBe(140_000);
  });

  it("rejects salary increase reasons below the previous salary", async () => {
    await runSeed(db);

    const annualIncrementResponse = await request(app).post("/api/employees/E001/compensation").send({
      baseSalary: 100_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "Annual Increment",
      changedBy: "HR Admin",
    });

    expect(annualIncrementResponse.status).toBe(400);
    expect(annualIncrementResponse.body.message).toMatch(/cannot be less than the previous salary/);

    const promotionResponse = await request(app).post("/api/employees/E001/compensation").send({
      baseSalary: 100_000,
      currency: "USD",
      effectiveDate: "2026-06-01",
      reason: "Promotion",
      changedBy: "HR Admin",
    });

    expect(promotionResponse.status).toBe(400);
    expect(promotionResponse.body.message).toMatch(/cannot be less than the previous salary/);
  });

  it("rejects New Hire when the employee already has compensation history", async () => {
    await runSeed(db);

    const response = await request(app).post("/api/employees/E001/compensation").send({
      baseSalary: 100_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "New Hire can only be used for an employee's first compensation record",
    );
  });

  it("rejects a missing effective date", async () => {
    await runSeed(db);

    const response = await request(app).post("/api/employees/E001/compensation").send({
      baseSalary: 140_000,
      currency: "USD",
      effectiveDate: "",
      reason: "Promotion",
      changedBy: "HR Admin",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation Error");
  });

  it("allows a promotion equal to the previous salary", async () => {
    await runSeed(db);

    const response = await request(app).post("/api/employees/E001/compensation").send({
      baseSalary: 132_000,
      currency: "USD",
      effectiveDate: "2026-06-01",
      reason: "Promotion",
      changedBy: "HR Admin",
    });

    expect(response.status).toBe(201);
    expect(response.body.entry).toMatchObject({
      baseSalary: 132_000,
      previousSalary: 132_000,
      reason: "Promotion",
    });
  });

  it("rejects salary increase reasons in a different currency than the predecessor", async () => {
    await runSeed(db);

    const response = await request(app).post("/api/employees/E001/compensation").send({
      baseSalary: 140_000,
      currency: "EUR",
      effectiveDate: "2026-06-01",
      reason: "Annual Increment",
      changedBy: "HR Admin",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Annual Increment must use USD to match the previous salary",
    );
  });
});
