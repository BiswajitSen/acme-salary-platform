import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeDatabaseConnection, runMigrations } from "./db/migrate.js";

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "API server started");
});

void runMigrations()
  .catch((error: unknown) => {
    logger.error({ err: error }, "Database migration failed");
    process.exit(1);
  });

process.on("SIGINT", () => {
  void closeDatabaseConnection();
});

process.on("SIGTERM", () => {
  void closeDatabaseConnection();
});
