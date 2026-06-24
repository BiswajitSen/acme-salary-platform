import { count } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type * as schema from "../../db/schema.js";
import { employees } from "../../db/schema.js";
import type {
  IEmployeeRepository,
  PaginatedEmployeesQuery,
  PaginatedEmployeesResult,
} from "../interfaces/employee.repository.js";
import { buildEmployeeMatchConditions } from "./employee-query-builder.js";

export function readAggregateCount(rows: { value: number }[]): number {
  return rows[0]?.value ?? 0;
}

type Database = BetterSQLite3Database<typeof schema>;

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

  async findDistinctFilterValues() {
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
}
