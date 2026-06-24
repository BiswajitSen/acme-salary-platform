process.env.NODE_ENV = "test";
process.env.DATABASE_URL = ":memory:";

import { runMigrations } from "../src/db/migrate.js";

runMigrations();
