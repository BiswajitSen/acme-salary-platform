import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { logger } from "../config/logger.js";
import type * as schema from "./schema.js";
import { employees } from "./schema.js";

type Database = BetterSQLite3Database<typeof schema>;

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

export async function runSeed(database: Database): Promise<void> {
  const inserted = await seedEmployees(database);
  logger.info({ inserted, total: sampleEmployees.length }, "Employee seed complete");
}

const isDirectRun = process.argv[1]?.endsWith("seed.ts");

if (isDirectRun) {
  const { db } = await import("./index.js");
  await runSeed(db);
}
