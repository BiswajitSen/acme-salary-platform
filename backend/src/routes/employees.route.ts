import { Router } from "express";

import type { CompensationService } from "../services/compensation.service.js";
import type { EmployeeService } from "../services/employee.service.js";

type EmployeeRouterDeps = {
  employeeService: EmployeeService;
  compensationService: CompensationService;
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

  router.post("/:id/compensation", async (req, res, next) => {
    try {
      const result = await deps.compensationService.recordCompensationChange(
        req.params.id,
        req.body,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/compensation", async (req, res, next) => {
    try {
      const history = await deps.employeeService.listEmployeeCompensationHistory(
        req.params.id,
      );
      res.json(history);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const profile = await deps.employeeService.getEmployeeProfile(req.params.id);
      res.json(profile);
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
