import { sql } from "drizzle-orm";

import type { ExchangeRatesToUsd } from "@acme/shared";

import {
  buildEmployeeScopeFilter,
  type EmployeeScopeParams,
} from "../../domain/insights/employee-scope.js";
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
import {
  buildTimelineStartExpression,
  type InsightTimelineWindow,
} from "../../domain/insights/timeline/window.js";
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

function buildCompensationReasonFilter(reasons: readonly string[]) {
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
    reason: row.reason as CompensationTimelineRecord["reason"],
  };
}

function scope(params: EmployeeScopeParams = {}) {
  return buildEmployeeScopeFilter(params);
}

export class DrizzleAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly database: Database) {}

  async countEmployeesWithLatestCompensation(
    scopeParams: EmployeeScopeParams = {},
  ): Promise<number> {
    const result = await this.database.execute<{ headcount: number }>(sql`
      SELECT COUNT(*)::int AS headcount
      FROM (${latestCompensationRows}) lc
      INNER JOIN employees e ON e.id = lc.employee_id
      WHERE ${scope(scopeParams)}
    `);

    return result.rows[0]?.headcount ?? 0;
  }

  async sumLatestCompensationSalariesInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    scopeParams: EmployeeScopeParams = {},
  ): Promise<number> {
    const convertedSalary = buildConvertedSalarySql(displayCurrency, ratesToUsd);

    const result = await this.database.execute<{ total_payroll: number }>(sql`
      WITH latest_compensation AS (${latestCompensationRows})
      SELECT COALESCE(SUM(${convertedSalary}), 0)::float8 AS total_payroll
      FROM latest_compensation lc
      INNER JOIN employees e ON e.id = lc.employee_id
      WHERE ${scope(scopeParams)}
    `);

    return result.rows[0]?.total_payroll ?? 0;
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
    scopeParams: EmployeeScopeParams = {},
  ): Promise<ScopedSalaryStatisticsRecord> {
    const convertedSalary = buildConvertedSalarySql(displayCurrency, ratesToUsd);

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
      WHERE ${scope(scopeParams)}
    `);

    return {
      employeeCount: result.rows[0]?.employee_count ?? 0,
      averageSalary: result.rows[0]?.average_salary ?? 0,
      medianSalary: result.rows[0]?.median_salary ?? 0,
    };
  }

  async findTopEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    limit: number,
    scopeParams: EmployeeScopeParams = {},
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
      WHERE ${scope(scopeParams)}
      ORDER BY base_salary DESC, lc.employee_id ASC
      LIMIT ${limit}
    `);

    return result.rows.map(mapTopEarnerRow);
  }

  async findBottomEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    limit: number,
    scopeParams: EmployeeScopeParams = {},
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
      WHERE ${scope(scopeParams)}
      ORDER BY base_salary ASC, lc.employee_id ASC
      LIMIT ${limit}
    `);

    return result.rows.map(mapTopEarnerRow);
  }

  async findNearMedianEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    tolerancePercent: number,
    scopeParams: EmployeeScopeParams = {},
  ): Promise<{ medianSalary: number; earners: TopEarnerRecord[] }> {
    const convertedSalary = buildConvertedSalarySql(displayCurrency, ratesToUsd);
    const lowerMultiplier = 1 - tolerancePercent / 100;
    const upperMultiplier = 1 + tolerancePercent / 100;

    const result = await this.database.execute<{
      employee_id: string;
      full_name: string;
      department: string;
      base_salary: number;
      median_salary: number;
    }>(sql`
      WITH latest_compensation AS (${latestCompensationRows}),
      scoped AS (
        SELECT
          lc.employee_id,
          e.full_name,
          e.department,
          ${convertedSalary} AS base_salary
        FROM latest_compensation lc
        INNER JOIN employees e ON e.id = lc.employee_id
        WHERE ${scope(scopeParams)}
      ),
      median_val AS (
        SELECT COALESCE(
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY base_salary),
          0
        )::float8 AS median_salary
        FROM scoped
      )
      SELECT
        s.employee_id,
        s.full_name,
        s.department,
        s.base_salary,
        m.median_salary
      FROM scoped s
      CROSS JOIN median_val m
      WHERE m.median_salary > 0
        AND s.base_salary >= m.median_salary * ${lowerMultiplier}
        AND s.base_salary <= m.median_salary * ${upperMultiplier}
      ORDER BY s.base_salary DESC, s.employee_id ASC
    `);

    const medianSalary = result.rows[0]?.median_salary ?? 0;

    return {
      medianSalary,
      earners: result.rows.map(mapTopEarnerRow),
    };
  }

  async findRecentCompensationEvents(
    asOfDate: string,
    window: InsightTimelineWindow,
    reasons: readonly string[],
    scopeParams: EmployeeScopeParams = {},
  ): Promise<CompensationTimelineRecord[]> {
    const reasonFilter = buildCompensationReasonFilter(reasons);
    const timelineStart = buildTimelineStartExpression(asOfDate, window);

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
        AND ch.effective_date >= ${timelineStart}
        AND ch.effective_date <= CAST(${asOfDate} AS date)
        AND ${scope(scopeParams)}
      ORDER BY ch.effective_date DESC, e.id ASC
    `);

    return result.rows.map(mapCompensationTimelineRow);
  }

  async findRecentPromotions(
    asOfDate: string,
    window: InsightTimelineWindow,
    scopeParams: EmployeeScopeParams = {},
  ): Promise<CompensationTimelineRecord[]> {
    return this.findRecentCompensationEvents(
      asOfDate,
      window,
      ["Promotion"],
      scopeParams,
    );
  }
}
