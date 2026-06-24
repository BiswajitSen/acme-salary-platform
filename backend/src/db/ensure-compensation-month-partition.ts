import { eq, sql } from "drizzle-orm";

import {
  buildCompensationMonthDateRange,
  buildCompensationPartitionTableName,
  deriveCompensationMonthKeyFromEffectiveDate,
} from "../domain/compensation-partition.js";
import type { Database } from "./index.js";
import { compensationMonthPartitions } from "./schema.js";

export async function ensureCompensationMonthPartitionExists(
  database: Database,
  effectiveDate: string,
): Promise<void> {
  const monthKey = deriveCompensationMonthKeyFromEffectiveDate(effectiveDate);

  const [existingPartition] = await database
    .select({ monthKey: compensationMonthPartitions.monthKey })
    .from(compensationMonthPartitions)
    .where(eq(compensationMonthPartitions.monthKey, monthKey))
    .limit(1);

  if (existingPartition) {
    return;
  }

  const { rangeStart, rangeEnd } = buildCompensationMonthDateRange(monthKey);
  const partitionTableName = buildCompensationPartitionTableName(monthKey);

  await database.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS "${partitionTableName}"
      PARTITION OF "compensation_history"
      FOR VALUES FROM ('${rangeStart}') TO ('${rangeEnd}');
    `),
  );

  await database
    .insert(compensationMonthPartitions)
    .values({
      monthKey,
      partitionTableName,
      rangeStart,
      rangeEnd,
    })
    .onConflictDoNothing();
}
