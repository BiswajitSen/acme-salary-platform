import { count, eq, sql } from "drizzle-orm";

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

export function readAggregateCount(rows: { value: number }[]): number {
  return rows[0]?.value ?? 0;
}

export class DrizzleEmployeeRepository implements IEmployeeRepository {
  constructor(private readonly database: Database) {}

  async findPaginated(
    query: PaginatedEmployeesQuery,
  ): Promise<PaginatedEmployeesResult> {
    const whereClause = buildEmployeeMatchConditions(query.filters);

    const totalQuery = this.database.select({ value: count() }).from(employees);
    const totalRows = whereClause
      ? await totalQuery.where(whereClause)
      : await totalQuery;

    const rowsQuery = this.database
      .select({
        id: employees.id,
        fullName: employees.fullName,
        department: employees.department,
        jobTitle: employees.jobTitle,
        country: employees.country,
      })
      .from(employees)
      .orderBy(employees.id)
      .limit(query.limit)
      .offset(query.offset);

    const rows = whereClause ? await rowsQuery.where(whereClause) : await rowsQuery;

    return {
      data: rows,
      total: readAggregateCount(totalRows),
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

    return employee ?? null;
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
