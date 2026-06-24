import { count } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type * as schema from "../../db/schema.js";
import { employees } from "../../db/schema.js";
import type {
  IEmployeeRepository,
  PaginatedEmployeesQuery,
  PaginatedEmployeesResult,
} from "../interfaces/employee.repository.js";

type Database = BetterSQLite3Database<typeof schema>;

export class DrizzleEmployeeRepository implements IEmployeeRepository {
  constructor(private readonly database: Database) {}

  async findPaginated(
    query: PaginatedEmployeesQuery,
  ): Promise<PaginatedEmployeesResult> {
    const [totalResult] = await this.database
      .select({ value: count() })
      .from(employees);

    const rows = await this.database
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

    return {
      data: rows,
      total: totalResult?.value ?? 0,
    };
  }
}
