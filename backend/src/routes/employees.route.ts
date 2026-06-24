import { Router } from "express";

import type { EmployeeService } from "../services/employee.service.js";

type EmployeeRouterDeps = {
  employeeService: EmployeeService;
};

export function createEmployeesRouter(deps: EmployeeRouterDeps) {
  const router = Router();

  router.get("/filter-options", async (_req, res, next) => {
    try {
      const options = await deps.employeeService.listEmployeeFilterOptions();
      res.json(options);
    } catch (error) {
      next(error);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const result = await deps.employeeService.listEmployees(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
