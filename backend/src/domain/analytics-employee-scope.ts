import { sql, type SQL } from "drizzle-orm";

export type EmployeeScopeParams = {
  country?: string;
  department?: string;
  jobTitle?: string;
};

export function buildEmployeeScopeFilter(scope: EmployeeScopeParams = {}): SQL {
  const filters: SQL[] = [];

  if (scope.country !== undefined) {
    filters.push(sql`e.country = ${scope.country}`);
  }

  if (scope.department !== undefined) {
    filters.push(sql`e.department = ${scope.department}`);
  }

  if (scope.jobTitle !== undefined) {
    filters.push(sql`LOWER(e.job_title) = LOWER(${scope.jobTitle})`);
  }

  if (filters.length === 0) {
    return sql`TRUE`;
  }

  return sql.join(filters, sql` AND `);
}

export function hasEmployeeScope(scope: EmployeeScopeParams = {}): boolean {
  return (
    scope.country !== undefined ||
    scope.department !== undefined ||
    scope.jobTitle !== undefined
  );
}
