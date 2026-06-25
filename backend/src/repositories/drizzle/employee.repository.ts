import { eq, inArray, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { latestCompensationRows } from "../../domain/analytics-latest-compensation.js";
import { toBasicEmployeeSummary, toEmployeeSummary } from "../../domain/employee-summary.js";
import { buildEmploymentStatusFilterClause } from "../../domain/employment-status-filter.js";
import type { EmployeeSpreadsheetRow } from "../../domain/employee-import.types.js";
import type { Database } from "../../db/index.js";
import { employees } from "../../db/schema.js";
import type {
  IEmployeeRepository,
  PaginatedEmployeesQuery,
  PaginatedEmployeesResult,
} from "../interfaces/employee.repository.js";
import { buildEmployeeMatchConditions } from "./employee-query-builder.js";

const UPSERT_BATCH_SIZE = 500;
const EXISTING_EMPLOYEE_ID_LOOKUP_BATCH_SIZE = 500;

export function readAggregateCount(rows: { value: number }[]): number {
  return rows[0]?.value ?? 0;
}

function employeeFilterClause(whereClause: SQL | undefined): SQL {
  return whereClause ?? sql`TRUE`;
}

export class DrizzleEmployeeRepository implements IEmployeeRepository {
  constructor(private readonly database: Database) {}

  async findPaginated(
    query: PaginatedEmployeesQuery,
  ): Promise<PaginatedEmployeesResult> {
    const employeeAlias = alias(employees, "e");
    const aliasedWhereClause = buildEmployeeMatchConditions(
      query.filters,
      employeeAlias,
    );
    const filterClause = employeeFilterClause(aliasedWhereClause);
    const employmentClause = buildEmploymentStatusFilterClause(
      query.filters.employmentStatuses,
    );
    const directoryFilterClause = sql`${filterClause} AND ${employmentClause}`;

    const [statsRows, directoryRows] = await Promise.all([
      this.database.execute<{
        total: number;
        active: number;
        departments: number;
      }>(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(lc.employee_id)::int AS active,
          COUNT(DISTINCT e.department)::int AS departments
        FROM employees e
        LEFT JOIN (${latestCompensationRows}) lc ON lc.employee_id = e.id
        WHERE ${directoryFilterClause}
      `),
      this.database.execute<{
        id: string;
        full_name: string;
        department: string;
        job_title: string;
        country: string;
        base_salary: number | null;
        currency: string | null;
      }>(sql`
        SELECT
          e.id,
          e.full_name,
          e.department,
          e.job_title,
          e.country,
          lc.base_salary,
          lc.currency
        FROM employees e
        LEFT JOIN (${latestCompensationRows}) lc ON lc.employee_id = e.id
        WHERE ${directoryFilterClause}
        ORDER BY e.id
        LIMIT ${query.limit}
        OFFSET ${query.offset}
      `),
    ]);

    const statsRow = statsRows.rows[0];
    const total = statsRow?.total ?? 0;
    const active = statsRow?.active ?? 0;

    return {
      data: directoryRows.rows.map((row) =>
        toEmployeeSummary({
          id: row.id,
          fullName: row.full_name,
          department: row.department,
          jobTitle: row.job_title,
          country: row.country,
          baseSalary: row.base_salary,
          currency: row.currency,
        }),
      ),
      total,
      stats: {
        total,
        active,
        noCompensation: Math.max(total - active, 0),
        departments: statsRow?.departments ?? 0,
      },
    };
  }

  async findEmployeeById(id: string) {
    const [employee] = await this.database
      .select({
        id: employees.id,
        fullName: employees.fullName,
        department: employees.department,
        jobTitle: employees.jobTitle,
        country: employees.country,
      })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    return employee ? toBasicEmployeeSummary(employee) : null;
  }

  async findExistingEmployeeIds(employeeIds: string[]): Promise<Set<string>> {
    if (employeeIds.length === 0) {
      return new Set();
    }

    const existingEmployeeIds = new Set<string>();

    for (
      let index = 0;
      index < employeeIds.length;
      index += EXISTING_EMPLOYEE_ID_LOOKUP_BATCH_SIZE
    ) {
      const batch = employeeIds.slice(index, index + EXISTING_EMPLOYEE_ID_LOOKUP_BATCH_SIZE);
      const rows = await this.database
        .select({ id: employees.id })
        .from(employees)
        .where(inArray(employees.id, batch));

      for (const row of rows) {
        existingEmployeeIds.add(row.id);
      }
    }

    return existingEmployeeIds;
  }

  async findDistinctEmployeeFilterValues() {
    const [countries, departments, jobTitles] = await Promise.all([
      this.database
        .selectDistinct({ value: employees.country })
        .from(employees)
        .orderBy(employees.country),
      this.database
        .selectDistinct({ value: employees.department })
        .from(employees)
        .orderBy(employees.department),
      this.database
        .selectDistinct({ value: employees.jobTitle })
        .from(employees)
        .orderBy(employees.jobTitle),
    ]);

    return {
      countries: countries.map((row) => row.value),
      departments: departments.map((row) => row.value),
      jobTitles: jobTitles.map((row) => row.value),
    };
  }

  async upsertManyEmployees(rows: EmployeeSpreadsheetRow[]) {
    const existingIds = new Set(
      (await this.database.select({ id: employees.id }).from(employees)).map(
        (employee) => employee.id,
      ),
    );

    await this.database.transaction(async (transaction) => {
      for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
        const batch = rows.slice(index, index + UPSERT_BATCH_SIZE);

        await transaction
          .insert(employees)
          .values(batch)
          .onConflictDoUpdate({
            target: employees.id,
            set: {
              fullName: sql`excluded.full_name`,
              department: sql`excluded.department`,
              jobTitle: sql`excluded.job_title`,
              country: sql`excluded.country`,
            },
          });
      }
    });

    const inserted = rows.filter((row) => !existingIds.has(row.id)).length;

    return {
      inserted,
      updated: rows.length - inserted,
      total: rows.length,
    };
  }
}
