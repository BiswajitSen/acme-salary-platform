import { and, eq } from "drizzle-orm";

import { logger } from "../config/logger.js";
import { ensureCompensationMonthPartitionExists } from "./ensure-compensation-month-partition.js";
import type { Database } from "./index.js";
import { compensationHistory, employees } from "./schema.js";

const sampleEmployees = [
  {
    id: "E001",
    fullName: "Jane Doe",
    department: "Engineering",
    jobTitle: "Senior Engineer",
    country: "US",
  },
  {
    id: "E002",
    fullName: "Bob Smith",
    department: "HR",
    jobTitle: "HR Manager",
    country: "UK",
  },
  {
    id: "E003",
    fullName: "Alice Chen",
    department: "Finance",
    jobTitle: "Financial Analyst",
    country: "SG",
  },
] as const;

const sampleCompensationHistory = [
  {
    employeeId: "E001",
    baseSalary: 120_000,
    currency: "USD",
    effectiveDate: "2024-01-01",
    reason: "New Hire" as const,
    changedBy: "HR Admin",
    notes: null,
    createdAt: "2024-01-02T10:00:00.000Z",
  },
  {
    employeeId: "E001",
    baseSalary: 132_000,
    currency: "USD",
    effectiveDate: "2025-01-01",
    reason: "Annual Increment" as const,
    changedBy: "HR Admin",
    notes: "Merit increase",
    createdAt: "2025-01-02T10:00:00.000Z",
  },
  {
    employeeId: "E002",
    baseSalary: 85_000,
    currency: "GBP",
    effectiveDate: "2024-06-01",
    reason: "New Hire" as const,
    changedBy: "HR Admin",
    notes: null,
    createdAt: "2024-06-02T10:00:00.000Z",
  },
] as const;

export async function seedEmployees(database: Database): Promise<number> {
  let inserted = 0;

  for (const employee of sampleEmployees) {
    const result = await database
      .insert(employees)
      .values(employee)
      .onConflictDoNothing()
      .returning({ id: employees.id });

    if (result.length > 0) {
      inserted += 1;
    }
  }

  return inserted;
}

export async function seedCompensationHistory(database: Database): Promise<number> {
  let inserted = 0;

  for (const record of sampleCompensationHistory) {
    await ensureCompensationMonthPartitionExists(database, record.effectiveDate);

    const existing = await database
      .select({ id: compensationHistory.id })
      .from(compensationHistory)
      .where(
        and(
          eq(compensationHistory.employeeId, record.employeeId),
          eq(compensationHistory.effectiveDate, record.effectiveDate),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    const result = await database
      .insert(compensationHistory)
      .values(record)
      .returning({ id: compensationHistory.id });

    if (result.length > 0) {
      inserted += 1;
    }
  }

  return inserted;
}

export async function runSeed(database: Database): Promise<void> {
  const insertedEmployees = await seedEmployees(database);
  const insertedCompensation = await seedCompensationHistory(database);

  logger.info(
    {
      insertedEmployees,
      totalEmployees: sampleEmployees.length,
      insertedCompensation,
      totalCompensation: sampleCompensationHistory.length,
    },
    "Employee seed complete",
  );
}

const isDirectRun = process.argv[1]?.endsWith("seed.ts");

if (isDirectRun) {
  const { closeDatabaseConnection, runMigrations } = await import("./migrate.js");
  const { db: database } = await import("./index.js");

  await runMigrations();
  await runSeed(database);
  await closeDatabaseConnection();
}
