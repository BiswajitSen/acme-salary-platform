import { and, eq, inArray, like, or, sql, type Column, type SQL } from "drizzle-orm";

import type { EmployeeListFilters } from "../../domain/employee-list-filters.js";
import { employees } from "../../db/schema.js";

type EmployeeFilterTable = {
  id: Column;
  fullName: Column;
  department: Column;
  jobTitle: Column;
  country: Column;
};

export function buildEmployeeMatchConditions(
  filters: EmployeeListFilters,
  table: EmployeeFilterTable = employees,
): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(table.id, pattern),
        sql`lower(${table.fullName}) like lower(${pattern})`,
      )!,
    );
  }

  if (filters.countries?.length) {
    conditions.push(
      filters.countries.length === 1
        ? eq(table.country, filters.countries[0]!)
        : inArray(table.country, filters.countries),
    );
  }

  if (filters.departments?.length) {
    conditions.push(
      filters.departments.length === 1
        ? eq(table.department, filters.departments[0]!)
        : inArray(table.department, filters.departments),
    );
  }

  if (filters.jobTitles?.length) {
    conditions.push(
      filters.jobTitles.length === 1
        ? eq(table.jobTitle, filters.jobTitles[0]!)
        : inArray(table.jobTitle, filters.jobTitles),
    );
  }

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}
