import path from "node:path";
import { fileURLToPath } from "node:url";

import type Database from "better-sqlite3";
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

export function ensureMigrationJournalTable(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    );
  `);
}

export function baselineMigrationJournalWhenTablesExistWithoutHistory(
  database: Database.Database,
  migrationsFolderPath: string,
): void {
  const employeesTable = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='employees'",
    )
    .get();

  if (!employeesTable) {
    return;
  }

  const { count } = database
    .prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
    .get() as { count: number };

  if (count > 0) {
    return;
  }

  logger.warn(
    "Legacy database detected (tables without migration journal) — baselining",
  );

  const migrations = readMigrationFiles({ migrationsFolder: migrationsFolderPath });

  for (const migration of migrations) {
    database
      .prepare(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      )
      .run(migration.hash, migration.folderMillis);
  }
}

export function runMigrations(): void {
  ensureMigrationJournalTable(sqlite);
  baselineMigrationJournalWhenTablesExistWithoutHistory(sqlite, migrationsFolder);
  migrate(db, { migrationsFolder });
  logger.info("Database migrations applied");
}

export function runMigrateCli(argv: string[] = process.argv): void {
  if (argv[1]?.endsWith("migrate.ts")) {
    runMigrations();
  }
}

void runMigrateCli();
