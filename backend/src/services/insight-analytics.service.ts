import {
  ANALYTICS_TOP_EARNERS_LIMIT,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
  type PromotedEmployee,
} from "@acme/shared";

import type { ScopedSalaryStatisticsRecord } from "../domain/analytics.types.js";
import { parseAnalyticsCurrencyQuery } from "../domain/analytics-query.js";
import { parseInsightAnalyticsQuery } from "../domain/insight-top-earners-query.js";
import type { IInsightAnalyticsRepository } from "../repositories/interfaces/insight-analytics.repository.js";
import type { IExchangeRateProvider } from "./exchange-rate.provider.js";

export class InsightAnalyticsService {
  constructor(
    private readonly analytics: IInsightAnalyticsRepository,
    private readonly exchangeRates: IExchangeRateProvider,
  ) {}

  async getAnalyticsSummary(query: unknown): Promise<AnalyticsSummaryResponse> {
    const { currency, country, department } = parseInsightAnalyticsQuery(query);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const headcount = await this.analytics.countEmployeesWithLatestCompensation(
      country,
      department,
    );
    const totalPayroll = await this.analytics.sumLatestCompensationSalariesInDisplayCurrency(
      currency,
      ratesToUsd,
      country,
      department,
    );

    return {
      currency,
      headcount,
      totalPayroll,
      exchangeRatesAsOf: asOf,
    };
  }

  async getScopedSalaryStatistics(query: unknown): Promise<
    ScopedSalaryStatisticsRecord & {
      currency: string;
      exchangeRatesAsOf: string;
    }
  > {
    const { currency, country, department } = parseInsightAnalyticsQuery(query);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const statistics = await this.analytics.findSalaryStatisticsInDisplayCurrency(
      currency,
      ratesToUsd,
      country,
      department,
    );

    return {
      currency,
      exchangeRatesAsOf: asOf,
      ...statistics,
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
    const { currency, country, department } = parseInsightAnalyticsQuery(query);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const earners = await this.analytics.findTopEarnersInDisplayCurrency(
      currency,
      ratesToUsd,
      ANALYTICS_TOP_EARNERS_LIMIT,
      country,
      department,
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

  async getRecentPromotions(query: {
    months: number;
    country?: string;
    department?: string;
  }): Promise<{ asOfDate: string; promotions: PromotedEmployee[] }> {
    const { asOf } = await this.exchangeRates.fetchSnapshot();
    const promotions = await this.analytics.findRecentPromotions(
      asOf,
      query.months,
      query.country,
      query.department,
    );

    return {
      asOfDate: asOf,
      promotions,
    };
  }
}
