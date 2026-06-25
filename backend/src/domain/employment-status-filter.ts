import type { EmployeeEmploymentStatus } from "@acme/shared";
import { sql, type SQL } from "drizzle-orm";

export function buildEmploymentStatusFilterClause(
  statuses: EmployeeEmploymentStatus[] | undefined,
): SQL {
  if (!statuses || statuses.length === 0) {
    return sql`TRUE`;
  }

  const includesActive = statuses.includes("ACTIVE");
  const includesNoCompensation = statuses.includes("NO_COMPENSATION");

  if (includesActive && includesNoCompensation) {
    return sql`TRUE`;
  }

  if (includesActive) {
    return sql`lc.employee_id IS NOT NULL`;
  }

  if (includesNoCompensation) {
    return sql`lc.employee_id IS NULL`;
  }

  return sql`TRUE`;
}
