import { Router } from "express";

import type { AnalyticsService } from "../services/analytics.service.js";

type AnalyticsRouterDeps = {
  analyticsService: AnalyticsService;
};

export function createAnalyticsRouter(deps: AnalyticsRouterDeps) {
  const router = Router();

  router.get("/summary", async (req, res, next) => {
    try {
      const summary = await deps.analyticsService.getAnalyticsSummary(req.query);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });

  router.get("/departments", async (req, res, next) => {
    try {
      const statistics = await deps.analyticsService.getDepartmentSalaryStatistics(
        req.query,
      );
      res.json(statistics);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
