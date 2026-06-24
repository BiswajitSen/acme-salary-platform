import path from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { logger } from "../config/logger.js";
import { db, pool } from "./index.js";

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "drizzle",
);

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder });
  logger.info("Database migrations applied");
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}

export function runMigrateCli(
  argv: string[] = process.argv,
  options: { runMigrationsImpl?: () => Promise<void> } = {},
): void {
  if (!argv[1]?.endsWith("migrate.ts")) {
    return;
  }

  const migrateRunner = options.runMigrationsImpl ?? runMigrations;

  void migrateRunner()
    .then(() => closeDatabaseConnection())
    .catch((error: unknown) => {
      logger.error({ err: error }, "Database migration failed");
      process.exitCode = 1;
    });
}

void runMigrateCli();
