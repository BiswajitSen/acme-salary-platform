import {
  ANALYTICS_TOP_EARNERS_LIMIT,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
} from "@acme/shared";

import { parseAnalyticsCurrencyQuery } from "../domain/analytics-query.js";
import type { IInsightAnalyticsRepository } from "../repositories/interfaces/insight-analytics.repository.js";
import type { IExchangeRateProvider } from "./exchange-rate.provider.js";

export class InsightAnalyticsService {
  constructor(
    private readonly analytics: IInsightAnalyticsRepository,
    private readonly exchangeRates: IExchangeRateProvider,
  ) {}

  async getAnalyticsSummary(query: unknown): Promise<AnalyticsSummaryResponse> {
    const currency = parseAnalyticsCurrencyQuery(query);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const headcount = await this.analytics.countEmployeesWithLatestCompensation();
    const totalPayroll = await this.analytics.sumLatestCompensationSalariesInDisplayCurrency(
      currency,
      ratesToUsd,
    );

    return {
      currency,
      headcount,
      totalPayroll,
      exchangeRatesAsOf: asOf,
    };
  }

  async getDepartmentSalaryStatistics(
    query: unknown,
  ): Promise<AnalyticsDepartmentStatisticsResponse> {
    const currency = parseAnalyticsCurrencyQuery(query);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const departments = await this.analytics.findDepartmentSalaryStatisticsInDisplayCurrency(
      currency,
      ratesToUsd,
    );

    return {
      currency,
      departments,
      exchangeRatesAsOf: asOf,
    };
  }

  async getTopEarners(query: unknown): Promise<AnalyticsTopEarnersResponse> {
    const currency = parseAnalyticsCurrencyQuery(query);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const earners = await this.analytics.findTopEarnersInDisplayCurrency(
      currency,
      ratesToUsd,
      ANALYTICS_TOP_EARNERS_LIMIT,
    );

    return {
      currency,
      earners,
      exchangeRatesAsOf: asOf,
    };
  }

  async getExchangeRatesAsOf(): Promise<string> {
    const { asOf } = await this.exchangeRates.fetchSnapshot();
    return asOf;
  }
}
