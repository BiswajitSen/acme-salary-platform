import { sql } from "drizzle-orm";

import type {
  DepartmentSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";
import {
  latestCompensationCurrencies,
  latestCompensationRows,
} from "../../domain/analytics-latest-compensation.js";
import type { Database } from "../../db/index.js";
import type { IAnalyticsRepository } from "../interfaces/analytics.repository.js";

function mapDepartmentSalaryRow(row: {
  department: string;
  employee_count: number;
  average_salary: number;
  median_salary: number;
}): DepartmentSalaryStatisticsRecord {
  return {
    department: row.department,
    employeeCount: row.employee_count,
    averageSalary: row.average_salary,
    medianSalary: row.median_salary,
  };
}

function mapTopEarnerRow(row: {
  employee_id: string;
  full_name: string;
  department: string;
  base_salary: number;
}): TopEarnerRecord {
  return {
    employeeId: row.employee_id,
    fullName: row.full_name,
    department: row.department,
    baseSalary: row.base_salary,
  };
}

export class DrizzleAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly database: Database) {}

  async findAvailableCurrencies(): Promise<string[]> {
    const result = await this.database.execute<{ currency: string }>(sql`
      SELECT DISTINCT currency
      FROM (${latestCompensationCurrencies}) latest_compensation
      ORDER BY currency ASC
    `);

    return result.rows.map((row) => row.currency);
  }

  async countEmployeesWithLatestCompensationInCurrency(
    currency: string,
  ): Promise<number> {
    const result = await this.database.execute<{ headcount: number }>(sql`
      SELECT COUNT(*)::int AS headcount
      FROM (${latestCompensationRows}) latest_compensation
      WHERE currency = ${currency}
    `);

    return result.rows[0]!.headcount;
  }

  async sumLatestCompensationSalariesInCurrency(currency: string): Promise<number> {
    const result = await this.database.execute<{ total_payroll: number }>(sql`
      SELECT COALESCE(SUM(base_salary), 0)::float8 AS total_payroll
      FROM (${latestCompensationRows}) latest_compensation
      WHERE currency = ${currency}
    `);

    return result.rows[0]!.total_payroll;
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
      WITH latest_compensation AS (${latestCompensationRows})
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

    return result.rows.map(mapDepartmentSalaryRow);
  }

  async findTopEarnersByCurrency(
    currency: string,
    limit: number,
  ): Promise<TopEarnerRecord[]> {
    const result = await this.database.execute<{
      employee_id: string;
      full_name: string;
      department: string;
      base_salary: number;
    }>(sql`
      WITH latest_compensation AS (${latestCompensationRows})
      SELECT
        lc.employee_id,
        e.full_name,
        e.department,
        lc.base_salary
      FROM latest_compensation lc
      INNER JOIN employees e ON e.id = lc.employee_id
      WHERE lc.currency = ${currency}
      ORDER BY lc.base_salary DESC, lc.employee_id ASC
      LIMIT ${limit}
    `);

    return result.rows.map(mapTopEarnerRow);
  }
}
