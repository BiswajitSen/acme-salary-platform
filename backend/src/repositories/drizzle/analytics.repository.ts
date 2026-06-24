import { sql } from "drizzle-orm";

import type { Database } from "../../db/index.js";
import type { IAnalyticsRepository } from "../interfaces/analytics.repository.js";

export class DrizzleAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly database: Database) {}

  async countEmployeesWithLatestCompensationInCurrency(
    currency: string,
  ): Promise<number> {
    const result = await this.database.execute<{ headcount: number }>(sql`
      SELECT COUNT(*)::int AS headcount
      FROM (
        SELECT DISTINCT ON (employee_id)
          employee_id,
          currency
        FROM compensation_history
        ORDER BY employee_id, effective_date DESC, id DESC
      ) latest_compensation
      WHERE currency = ${currency}
    `);

    return result.rows[0].headcount;
  }
}
