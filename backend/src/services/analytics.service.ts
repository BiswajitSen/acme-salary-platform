import {
  analyticsSummaryQuerySchema,
  type AnalyticsSummaryResponse,
} from "@acme/shared";

import type { IAnalyticsRepository } from "../repositories/interfaces/analytics.repository.js";

export class AnalyticsService {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async getAnalyticsSummary(query: unknown): Promise<AnalyticsSummaryResponse> {
    const { currency } = analyticsSummaryQuerySchema.parse(query);
    const headcount =
      await this.analytics.countEmployeesWithLatestCompensationInCurrency(currency);

    return {
      currency,
      headcount,
    };
  }
}
