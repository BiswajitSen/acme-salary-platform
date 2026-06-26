import {
  ANALYTICS_DISPLAY_CURRENCIES,
  ANALYTICS_TOP_EARNERS_LIMIT,
  type AnalyticsCompensatedEmployeesResponse,
  type AnalyticsCurrenciesResponse,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
} from "@acme/shared";

import { parseAnalyticsCurrencyQuery } from "../domain/analytics-query.js";
import type { IAnalyticsRepository } from "../repositories/interfaces/analytics.repository.js";
import type { IExchangeRateProvider } from "./exchange-rate.provider.js";

export class AnalyticsService {
  constructor(
    private readonly analytics: IAnalyticsRepository,
    private readonly exchangeRates: IExchangeRateProvider,
  ) {}

  async getAvailableCurrencies(): Promise<AnalyticsCurrenciesResponse> {
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();

    return {
      currencies: [...ANALYTICS_DISPLAY_CURRENCIES],
      exchangeRatesAsOf: asOf,
      ratesToUsd,
    };
  }

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

  async getCompensatedEmployees(
    query: unknown,
  ): Promise<AnalyticsCompensatedEmployeesResponse> {
    const currency = parseAnalyticsCurrencyQuery(query);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const employees = await this.analytics.findCompensatedEmployeesInDisplayCurrency(
      currency,
      ratesToUsd,
    );

    return {
      currency,
      employees,
      exchangeRatesAsOf: asOf,
    };
  }
}
