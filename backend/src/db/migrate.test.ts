import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import {
  baselineMigrationJournalWhenTablesExistWithoutHistory,
  ensureMigrationJournalTable,
  runMigrateCli,
  runMigrations,
} from "./migrate.js";

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "drizzle",
);

function createLegacyEmployeesTable(database: Database.Database): void {
  database.exec(`
    CREATE TABLE employees (
      id text PRIMARY KEY NOT NULL,
      full_name text NOT NULL,
      department text NOT NULL,
      job_title text NOT NULL,
      country text NOT NULL
    );
  `);
}

describe("ensureMigrationJournalTable", () => {
  it("creates the drizzle migration journal table", () => {
    const database = new Database(":memory:");

    ensureMigrationJournalTable(database);

    const journalTable = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'",
      )
      .get();

    expect(journalTable).toBeDefined();
    database.close();
  });
});

describe("baselineMigrationJournalWhenTablesExistWithoutHistory", () => {
  it("inserts migration hashes when legacy employee tables exist", () => {
    const database = new Database(":memory:");
    createLegacyEmployeesTable(database);
    ensureMigrationJournalTable(database);

    baselineMigrationJournalWhenTablesExistWithoutHistory(database, migrationsFolder);

    const { count } = database
      .prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
      .get() as { count: number };

    expect(count).toBeGreaterThan(0);
    database.close();
  });

  it("skips baselining when the employees table does not exist", () => {
    const database = new Database(":memory:");
    ensureMigrationJournalTable(database);

    baselineMigrationJournalWhenTablesExistWithoutHistory(database, migrationsFolder);

    const { count } = database
      .prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
      .get() as { count: number };

    expect(count).toBe(0);
    database.close();
  });

  it("skips baselining when the journal already contains entries", () => {
    const database = new Database(":memory:");
    createLegacyEmployeesTable(database);
    ensureMigrationJournalTable(database);
    database
      .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
      .run("existing-hash", Date.now());

    baselineMigrationJournalWhenTablesExistWithoutHistory(database, migrationsFolder);

    const { count } = database
      .prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
      .get() as { count: number };

    expect(count).toBe(1);
    database.close();
  });
});

describe("runMigrateCli", () => {
  it("runs migrations when invoked as a script entrypoint", () => {
    expect(() => runMigrateCli(["node", "migrate.ts"])).not.toThrow();
  });

  it("skips migrations when imported as a module", () => {
    expect(() => runMigrateCli(["node", "vitest"])).not.toThrow();
  });
});

describe("runMigrations", () => {
  it("applies migrations to the configured database", () => {
    expect(() => runMigrations()).not.toThrow();
  });
});
