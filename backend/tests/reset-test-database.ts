import { sql } from "drizzle-orm";

import type { Database } from "../src/db/index.js";

export async function resetTestDatabase(database: Database): Promise<void> {
  await database.execute(
    sql`TRUNCATE TABLE compensation_history, employees, compensation_month_partitions RESTART IDENTITY CASCADE`,
  );
}
