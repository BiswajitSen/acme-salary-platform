import { beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??=
  "postgresql://acme:acme@localhost:5433/acme_salary_test";

const { runMigrations } = await import("../src/db/migrate.js");
const { db } = await import("../src/db/index.js");
const { resetTestDatabase } = await import("./reset-test-database.js");

await runMigrations();

beforeEach(async () => {
  await resetTestDatabase(db);
});
