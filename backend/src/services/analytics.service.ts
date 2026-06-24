import {
  ANALYTICS_TOP_EARNERS_LIMIT,
  analyticsSummaryQuerySchema,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
} from "@acme/shared";

import type { IAnalyticsRepository } from "../repositories/interfaces/analytics.repository.js";

export class AnalyticsService {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async getAnalyticsSummary(query: unknown): Promise<AnalyticsSummaryResponse> {
    const { currency } = analyticsSummaryQuerySchema.parse(query);
    const headcount =
      await this.analytics.countEmployeesWithLatestCompensationInCurrency(currency);
    const totalPayroll =
      await this.analytics.sumLatestCompensationSalariesInCurrency(currency);

    return {
      currency,
      headcount,
      totalPayroll,
    };
  }

  async getDepartmentSalaryStatistics(
    query: unknown,
  ): Promise<AnalyticsDepartmentStatisticsResponse> {
    const { currency } = analyticsSummaryQuerySchema.parse(query);
    const departments =
      await this.analytics.findDepartmentSalaryStatisticsByCurrency(currency);

    return {
      currency,
      departments,
    };
  }

  async getTopEarners(query: unknown): Promise<AnalyticsTopEarnersResponse> {
    const { currency } = analyticsSummaryQuerySchema.parse(query);
    const earners = await this.analytics.findTopEarnersByCurrency(
      currency,
      ANALYTICS_TOP_EARNERS_LIMIT,
    );

    return {
      currency,
      earners,
    };
  }
}
