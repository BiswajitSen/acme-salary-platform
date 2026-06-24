import {
  ANALYTICS_TOP_EARNERS_LIMIT,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
} from "@acme/shared";

import { parseAnalyticsCurrencyQuery } from "../domain/analytics-query.js";
import type { IInsightAnalyticsRepository } from "../repositories/interfaces/insight-analytics.repository.js";

export class InsightAnalyticsService {
  constructor(private readonly analytics: IInsightAnalyticsRepository) {}

  async getAnalyticsSummary(query: unknown): Promise<AnalyticsSummaryResponse> {
    const currency = parseAnalyticsCurrencyQuery(query);
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
    const currency = parseAnalyticsCurrencyQuery(query);
    const departments =
      await this.analytics.findDepartmentSalaryStatisticsByCurrency(currency);

    return {
      currency,
      departments,
    };
  }

  async getTopEarners(query: unknown): Promise<AnalyticsTopEarnersResponse> {
    const currency = parseAnalyticsCurrencyQuery(query);
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
