import { Router } from "express";

import { getHealthStatus } from "../services/health.service.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res, next) => {
  try {
    const health = await getHealthStatus();
    res.json(health);
  } catch (error) {
    next(error);
  }
});
