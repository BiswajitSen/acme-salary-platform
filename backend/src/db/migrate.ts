import path from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { logger } from "../config/logger.js";
import { db } from "./index.js";

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "drizzle",
);

export function runMigrations(): void {
  migrate(db, { migrationsFolder });
  logger.info("Database migrations applied");
}

const isDirectRun = process.argv[1]?.endsWith("migrate.ts");

if (isDirectRun) {
  runMigrations();
}
