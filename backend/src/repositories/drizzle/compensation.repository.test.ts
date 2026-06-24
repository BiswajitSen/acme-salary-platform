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
});
