import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { createContainer } from "./container/index.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { db } from "./db/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { createApiRouter } from "./routes/index.js";

export function createApp() {
  const container = createContainer(db);
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== "test",
    }),
  );

  app.use("/api", createApiRouter(container));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
