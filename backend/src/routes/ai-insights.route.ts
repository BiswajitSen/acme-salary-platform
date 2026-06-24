import { Router } from "express";

import type { AiInsightsService } from "../services/ai-insights.service.js";

type AiInsightsRouterDeps = {
  aiInsightsService: AiInsightsService;
};

export function createAiInsightsRouter(deps: AiInsightsRouterDeps) {
  const router = Router();

  router.post("/parse", async (req, res, next) => {
    try {
      const parsedQuery = deps.aiInsightsService.parseQuery(req.body);
      res.json(parsedQuery);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
