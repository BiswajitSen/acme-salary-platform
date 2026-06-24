import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "./index.js";
import { compensationHistory, employees } from "./schema.js";
import { runSeed, seedCompensationHistory, seedEmployees } from "./seed.js";

describe("seedEmployees", () => {
  it("does not duplicate employees on subsequent runs", async () => {
    await seedEmployees(db);
    const countAfterFirst = (await db.select({ id: employees.id }).from(employees))
      .length;

    const secondInsertCount = await seedEmployees(db);
    const countAfterSecond = (await db.select({ id: employees.id }).from(employees))
      .length;

    expect(secondInsertCount).toBe(0);
    expect(countAfterSecond).toBe(countAfterFirst);
  });

  it("runSeed completes without error", async () => {
    await expect(runSeed(db)).resolves.toBeUndefined();
  });

  it("does not duplicate compensation records on subsequent runs", async () => {
    await seedCompensationHistory(db);
    const countAfterFirst = (
      await db.select({ id: compensationHistory.id }).from(compensationHistory)
    ).length;

    const secondInsertCount = await seedCompensationHistory(db);
    const countAfterSecond = (
      await db.select({ id: compensationHistory.id }).from(compensationHistory)
    ).length;

    expect(secondInsertCount).toBe(0);
    expect(countAfterSecond).toBe(countAfterFirst);
  });
});
