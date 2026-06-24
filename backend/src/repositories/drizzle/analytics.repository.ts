import { sql } from "drizzle-orm";

import type { DepartmentSalaryStatisticsRecord } from "../../domain/analytics.types.js";
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

  async sumLatestCompensationSalariesInCurrency(currency: string): Promise<number> {
    const result = await this.database.execute<{ total_payroll: number }>(sql`
      SELECT COALESCE(SUM(base_salary), 0)::float8 AS total_payroll
      FROM (
        SELECT DISTINCT ON (employee_id)
          employee_id,
          base_salary,
          currency
        FROM compensation_history
        ORDER BY employee_id, effective_date DESC, id DESC
      ) latest_compensation
      WHERE currency = ${currency}
    `);

    return result.rows[0].total_payroll;
  }

  async findDepartmentSalaryStatisticsByCurrency(
    currency: string,
  ): Promise<DepartmentSalaryStatisticsRecord[]> {
    const result = await this.database.execute<{
      department: string;
      employee_count: number;
      average_salary: number;
      median_salary: number;
    }>(sql`
      WITH latest_compensation AS (
        SELECT DISTINCT ON (employee_id)
          employee_id,
          base_salary,
          currency
        FROM compensation_history
        ORDER BY employee_id, effective_date DESC, id DESC
      )
      SELECT
        e.department,
        COUNT(*)::int AS employee_count,
        AVG(lc.base_salary)::float8 AS average_salary,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lc.base_salary)::float8 AS median_salary
      FROM latest_compensation lc
      INNER JOIN employees e ON e.id = lc.employee_id
      WHERE lc.currency = ${currency}
      GROUP BY e.department
      ORDER BY e.department ASC
    `);

    return result.rows.map((row) => ({
      department: row.department,
      employeeCount: row.employee_count,
      averageSalary: row.average_salary,
      medianSalary: row.median_salary,
    }));
  }
}
