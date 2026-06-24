import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "./index.js";
import { ensureCompensationMonthPartitionExists } from "./ensure-compensation-month-partition.js";
import { compensationMonthPartitions } from "./schema.js";
import { runMigrations } from "./migrate.js";

describe("ensureCompensationMonthPartitionExists", () => {
  it("creates a monthly partition when one does not exist", async () => {
    await runMigrations();
    await ensureCompensationMonthPartitionExists(db, "2026-04-01");

    const partitions = await db.select().from(compensationMonthPartitions);
    const createdPartition = partitions.find(
      (partition) => partition.monthKey === "2026-04",
    );

    expect(createdPartition).toMatchObject({
      monthKey: "2026-04",
      partitionTableName: "compensation_history_2026_04",
      rangeStart: "2026-04-01",
      rangeEnd: "2026-05-01",
    });
  });

  it("does not recreate an existing monthly partition", async () => {
    await runMigrations();
    await ensureCompensationMonthPartitionExists(db, "2026-05-15");
    await ensureCompensationMonthPartitionExists(db, "2026-05-20");

    const partitions = await db
      .select()
      .from(compensationMonthPartitions)
      .where(eq(compensationMonthPartitions.monthKey, "2026-05"));

    expect(partitions).toHaveLength(1);
  });
});
