import { describe, expect, it } from "vitest";

import { db } from "../../db/index.js";
import { runSeed } from "../../db/seed.js";
import { DrizzleCompensationRepository } from "./compensation.repository.js";

describe("DrizzleCompensationRepository", () => {
  const repository = new DrizzleCompensationRepository(db);

  it("returns compensation history for an employee", async () => {
    await runSeed(db);

    const history = await repository.findCompensationHistoryByEmployeeId("E001");

    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.every((record) => record.employeeId === "E001")).toBe(true);
  });

  it("returns an empty list when an employee has no compensation history", async () => {
    await runSeed(db);

    await expect(repository.findCompensationHistoryByEmployeeId("E003")).resolves.toEqual([]);
  });

  it("inserts a new compensation history row", async () => {
    await runSeed(db);

    const insertedRecord = await repository.insertCompensationHistoryRecord({
      employeeId: "E003",
      baseSalary: 95_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
      notes: "Initial offer",
    });

    expect(insertedRecord.id).toBeGreaterThan(0);
    expect(insertedRecord.employeeId).toBe("E003");

    const history = await repository.findCompensationHistoryByEmployeeId("E003");
    expect(history).toHaveLength(1);
    expect(history[0]?.baseSalary).toBe(95_000);
  });

  it("returns zero when no records are provided", async () => {
    await expect(repository.insertManyCompensationHistoryRecords([])).resolves.toEqual({
      inserted: 0,
      total: 0,
    });
  });

  it("inserts many compensation history rows in one transaction", async () => {
    await runSeed(db);

    const result = await repository.insertManyCompensationHistoryRecords([
      {
        employeeId: "E003",
        baseSalary: 96_000,
        currency: "USD",
        effectiveDate: "2026-02-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: "Bulk import",
      },
      {
        employeeId: "E003",
        baseSalary: 98_000,
        currency: "USD",
        effectiveDate: "2026-03-01",
        reason: "Market Adjustment",
        changedBy: "HR Admin",
        notes: null,
      },
    ]);

    expect(result).toEqual({ inserted: 2, total: 2 });

    const history = await repository.findCompensationHistoryByEmployeeId("E003");
    expect(history).toHaveLength(2);
  });

  it("exposes insert only and has no update or delete methods", () => {
    expect(repository.insertCompensationHistoryRecord).toBeDefined();
    expect("updateCompensationHistoryRecord" in repository).toBe(false);
    expect("deleteCompensationHistoryRecord" in repository).toBe(false);
  });
});
