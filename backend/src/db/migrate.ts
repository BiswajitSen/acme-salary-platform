import path from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";

import { logger } from "../config/logger.js";
import { db, sqlite } from "./index.js";

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "drizzle",
);

function ensureMigrationsTable(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    );
  `);
}

/**
 * The initial scaffold created tables via raw SQL before Drizzle migrations
 * were tracked. If tables exist but the journal is empty, baseline it so
 * migrate() does not attempt to recreate existing tables.
 */
function baselineLegacySchemaIfNeeded(): void {
  const employeesTable = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='employees'",
    )
    .get();

  if (!employeesTable) {
    return;
  }

  const { count } = sqlite
    .prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
    .get() as { count: number };

  if (count > 0) {
    return;
  }

  logger.warn(
    "Legacy database detected (tables without migration journal) — baselining",
  );

  const migrations = readMigrationFiles({ migrationsFolder });

  for (const migration of migrations) {
    sqlite
      .prepare(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      )
      .run(migration.hash, migration.folderMillis);
  }
}

export function runMigrations(): void {
  ensureMigrationsTable();
  baselineLegacySchemaIfNeeded();
  migrate(db, { migrationsFolder });
  logger.info("Database migrations applied");
}

const isDirectRun = process.argv[1]?.endsWith("migrate.ts");

if (isDirectRun) {
  runMigrations();
}
