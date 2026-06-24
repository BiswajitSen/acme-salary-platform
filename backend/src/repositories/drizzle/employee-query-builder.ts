import { and, eq, like, or, sql, type SQL } from "drizzle-orm";

import type { EmployeeListFilters } from "../../domain/employee-list-filters.js";
import { employees } from "../../db/schema.js";

export function buildEmployeeMatchConditions(
  filters: EmployeeListFilters,
): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(employees.id, pattern),
        sql`lower(${employees.fullName}) like lower(${pattern})`,
      )!,
    );
  }

  if (filters.country) {
    conditions.push(eq(employees.country, filters.country));
  }

  if (filters.department) {
    conditions.push(eq(employees.department, filters.department));
  }

  if (filters.jobTitle) {
    conditions.push(eq(employees.jobTitle, filters.jobTitle));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}
