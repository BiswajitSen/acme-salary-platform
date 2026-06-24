import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeDatabaseConnection, runMigrations } from "./db/migrate.js";

await runMigrations();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "API server started");
});

process.on("SIGINT", () => {
  void closeDatabaseConnection();
});

process.on("SIGTERM", () => {
  void closeDatabaseConnection();
});
