import {
  ANALYTICS_DISPLAY_CURRENCIES,
  ANALYTICS_TOP_EARNERS_LIMIT,
  type AnalyticsCurrenciesResponse,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
} from "@acme/shared";

import { parseAnalyticsCurrencyQuery } from "../domain/analytics-query.js";
import type { IAnalyticsRepository } from "../repositories/interfaces/analytics.repository.js";

export class AnalyticsService {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async getAvailableCurrencies(): Promise<AnalyticsCurrenciesResponse> {
    return { currencies: [...ANALYTICS_DISPLAY_CURRENCIES] };
  }

  async getAnalyticsSummary(query: unknown): Promise<AnalyticsSummaryResponse> {
    const currency = parseAnalyticsCurrencyQuery(query);
    const headcount = await this.analytics.countEmployeesWithLatestCompensation();
    const totalPayroll =
      await this.analytics.sumLatestCompensationSalariesInDisplayCurrency(currency);

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
      await this.analytics.findDepartmentSalaryStatisticsInDisplayCurrency(currency);

    return {
      currency,
      departments,
    };
  }

  async getTopEarners(query: unknown): Promise<AnalyticsTopEarnersResponse> {
    const currency = parseAnalyticsCurrencyQuery(query);
    const earners = await this.analytics.findTopEarnersInDisplayCurrency(
      currency,
      ANALYTICS_TOP_EARNERS_LIMIT,
    );

    return {
      currency,
      earners,
    };
  }
}
