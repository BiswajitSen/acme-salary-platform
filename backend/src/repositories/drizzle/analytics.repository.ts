import { sql } from "drizzle-orm";

import type { ExchangeRatesToUsd } from "@acme/shared";

import type {
  DepartmentSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";
import { buildConvertedSalarySql } from "../../domain/analytics-currency-conversion.js";
import {
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

  async countEmployeesWithLatestCompensation(): Promise<number> {
    const result = await this.database.execute<{ headcount: number }>(sql`
      SELECT COUNT(*)::int AS headcount
      FROM (${latestCompensationRows}) latest_compensation
    `);

    return result.rows[0].headcount;
  }

  async sumLatestCompensationSalariesInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
  ): Promise<number> {
    const convertedSalary = buildConvertedSalarySql(displayCurrency, ratesToUsd);

    const result = await this.database.execute<{ total_payroll: number }>(sql`
      WITH latest_compensation AS (${latestCompensationRows})
      SELECT COALESCE(SUM(${convertedSalary}), 0)::float8 AS total_payroll
      FROM latest_compensation lc
    `);

    return result.rows[0].total_payroll;
  }

  async findDepartmentSalaryStatisticsInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
  ): Promise<DepartmentSalaryStatisticsRecord[]> {
    const convertedSalary = buildConvertedSalarySql(displayCurrency, ratesToUsd);

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
        AVG(${convertedSalary})::float8 AS average_salary,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${convertedSalary})::float8 AS median_salary
      FROM latest_compensation lc
      INNER JOIN employees e ON e.id = lc.employee_id
      GROUP BY e.department
      ORDER BY e.department ASC
    `);

    return result.rows.map(mapDepartmentSalaryRow);
  }

  async findTopEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    limit: number,
  ): Promise<TopEarnerRecord[]> {
    const convertedSalary = buildConvertedSalarySql(displayCurrency, ratesToUsd);

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
        ${convertedSalary} AS base_salary
      FROM latest_compensation lc
      INNER JOIN employees e ON e.id = lc.employee_id
      ORDER BY base_salary DESC, lc.employee_id ASC
      LIMIT ${limit}
    `);

    return result.rows.map(mapTopEarnerRow);
  }
}
