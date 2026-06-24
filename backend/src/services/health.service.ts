import type { HealthStatus } from "@acme/shared";
import { count } from "drizzle-orm";

import { db } from "../db/index.js";
import { compensationHistory, employees } from "../db/schema.js";

export async function getHealthStatus(): Promise<HealthStatus> {
  const [employeeResult] = await db.select({ value: count() }).from(employees);
  const [compensationResult] = await db
    .select({ value: count() })
    .from(compensationHistory);

  return {
    status: "ok",
    database: "connected",
    employees: employeeResult?.value ?? 0,
    compensationRecords: compensationResult?.value ?? 0,
  };
}
