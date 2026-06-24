import { Router } from "express";

import type { Container } from "../container/index.js";
import { createCompensationImportRouter } from "./compensation-import.route.js";
import { createEmployeeImportRouter } from "./employee-import.route.js";
import { createEmployeesRouter } from "./employees.route.js";
import { healthRouter } from "./health.route.js";

export function createApiRouter(container: Container) {
  const router = Router();

  router.use("/health", healthRouter);
  router.use(
    "/employees",
    createEmployeesRouter({
      employeeService: container.employeeService,
      compensationService: container.compensationService,
    }),
  );
  router.use(
    "/import",
    createEmployeeImportRouter({
      employeeImportService: container.employeeImportService,
    }),
  );
  router.use(
    "/import/compensation",
    createCompensationImportRouter({
      compensationImportService: container.compensationImportService,
    }),
  );

  return router;
}
