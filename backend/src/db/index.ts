import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { env } from "../config/env.js";
import * as schema from "./schema.js";

const backendRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function resolveDatabasePath(databaseUrl: string): string {
  if (databaseUrl === ":memory:") {
    return databaseUrl;
  }

  const resolved = path.isAbsolute(databaseUrl)
    ? databaseUrl
    : path.join(backendRoot, databaseUrl);

  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}

const sqlite = new Database(resolveDatabasePath(env.DATABASE_URL));

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };
