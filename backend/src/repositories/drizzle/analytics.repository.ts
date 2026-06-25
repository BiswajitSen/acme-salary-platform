import { sql, type SQL } from "drizzle-orm";

import type { ExchangeRatesToUsd } from "@acme/shared";

import type {
  CompensationTimelineRecord,
  DepartmentSalaryStatisticsRecord,
  ScopedSalaryStatisticsRecord,
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

function buildCompensationReasonFilter(reasons: readonly string[]): SQL {
  if (reasons.length === 1) {
    return sql`ch.reason = ${reasons[0]}`;
  }

  return sql`ch.reason IN (${sql.join(
    reasons.map((reason) => sql`${reason}`),
    sql`, `,
  )})`;
}

function mapCompensationTimelineRow(row: {
  employee_id: string;
  full_name: string;
  department: string;
  base_salary: number;
  currency: string;
  effective_date: string;
  reason: string;
}): CompensationTimelineRecord {
  return {
    employeeId: row.employee_id,
    fullName: row.full_name,
    department: row.department,
    baseSalary: row.base_salary,
    currency: row.currency,
    effectiveDate: row.effective_date,
    reason: row.reason,
  };
}

function buildEmployeeScopeFilter(country?: string, department?: string): SQL {
  const filters: SQL[] = [];

  if (country !== undefined) {
    filters.push(sql`e.country = ${country}`);
  }

  if (department !== undefined) {
    filters.push(sql`e.department = ${department}`);
  }

  if (filters.length === 0) {
    return sql`TRUE`;
  }

  return sql.join(filters, sql` AND `);
}

export class DrizzleAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly database: Database) {}

  async countEmployeesWithLatestCompensation(
    country?: string,
    department?: string,
  ): Promise<number> {
    const scopeFilter = buildEmployeeScopeFilter(country, department);

    const result = await this.database.execute<{ headcount: number }>(sql`
      SELECT COUNT(*)::int AS headcount
      FROM (${latestCompensationRows}) lc
      INNER JOIN employees e ON e.id = lc.employee_id
      WHERE ${scopeFilter}
    `);

    return result.rows[0].headcount;
  }

  async sumLatestCompensationSalariesInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    country?: string,
    department?: string,
  ): Promise<number> {
    const convertedSalary = buildConvertedSalarySql(displayCurrency, ratesToUsd);
    const scopeFilter = buildEmployeeScopeFilter(country, department);

    const result = await this.database.execute<{ total_payroll: number }>(sql`
      WITH latest_compensation AS (${latestCompensationRows})
      SELECT COALESCE(SUM(${convertedSalary}), 0)::float8 AS total_payroll
      FROM latest_compensation lc
      INNER JOIN employees e ON e.id = lc.employee_id
      WHERE ${scopeFilter}
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

  async findSalaryStatisticsInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    country?: string,
    department?: string,
  ): Promise<ScopedSalaryStatisticsRecord> {
    const convertedSalary = buildConvertedSalarySql(displayCurrency, ratesToUsd);
    const scopeFilter = buildEmployeeScopeFilter(country, department);

    const result = await this.database.execute<{
      employee_count: number;
      average_salary: number;
      median_salary: number;
    }>(sql`
      WITH latest_compensation AS (${latestCompensationRows})
      SELECT
        COUNT(*)::int AS employee_count,
        COALESCE(AVG(${convertedSalary}), 0)::float8 AS average_salary,
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${convertedSalary}), 0)::float8 AS median_salary
      FROM latest_compensation lc
      INNER JOIN employees e ON e.id = lc.employee_id
      WHERE ${scopeFilter}
    `);

    return {
      employeeCount: result.rows[0].employee_count,
      averageSalary: result.rows[0].average_salary,
      medianSalary: result.rows[0].median_salary,
    };
  }

  async findTopEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    limit: number,
    country?: string,
    department?: string,
  ): Promise<TopEarnerRecord[]> {
    const convertedSalary = buildConvertedSalarySql(displayCurrency, ratesToUsd);
    const scopeFilter = buildEmployeeScopeFilter(country, department);

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
      WHERE ${scopeFilter}
      ORDER BY base_salary DESC, lc.employee_id ASC
      LIMIT ${limit}
    `);

    return result.rows.map(mapTopEarnerRow);
  }

  async findRecentCompensationEvents(
    asOfDate: string,
    withinMonths: number,
    reasons: readonly string[],
    country?: string,
    department?: string,
  ): Promise<CompensationTimelineRecord[]> {
    const scopeFilter = buildEmployeeScopeFilter(country, department);
    const reasonFilter = buildCompensationReasonFilter(reasons);

    const result = await this.database.execute<{
      employee_id: string;
      full_name: string;
      department: string;
      base_salary: number;
      currency: string;
      effective_date: string;
      reason: string;
    }>(sql`
      SELECT
        e.id AS employee_id,
        e.full_name,
        e.department,
        ch.base_salary,
        ch.currency,
        ch.effective_date::text AS effective_date,
        ch.reason
      FROM compensation_history ch
      INNER JOIN employees e ON e.id = ch.employee_id
      WHERE ${reasonFilter}
        AND ch.effective_date >= (${asOfDate}::date - (${withinMonths} * INTERVAL '1 month'))::date
        AND ch.effective_date <= ${asOfDate}::date
        AND ${scopeFilter}
      ORDER BY ch.effective_date DESC, e.id ASC
    `);

    return result.rows.map(mapCompensationTimelineRow);
  }

  async findRecentPromotions(
    asOfDate: string,
    withinMonths: number,
    country?: string,
    department?: string,
  ): Promise<CompensationTimelineRecord[]> {
    return this.findRecentCompensationEvents(
      asOfDate,
      withinMonths,
      ["Promotion"],
      country,
      department,
    );
  }
}
