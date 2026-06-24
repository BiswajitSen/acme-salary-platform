import { Router } from "express";

import type { Container } from "../container/index.js";
import { createEmployeesRouter } from "./employees.route.js";
import { healthRouter } from "./health.route.js";

export function createApiRouter(container: Container) {
  const router = Router();

  router.use("/health", healthRouter);
  router.use(
    "/employees",
    createEmployeesRouter({ employeeService: container.employeeService }),
  );

  return router;
}
