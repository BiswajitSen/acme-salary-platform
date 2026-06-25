import type { ExchangeRatesToUsd } from "./currency-conversion.js";

export {
  ANALYTICS_DISPLAY_CURRENCIES,
  analyticsSummaryQuerySchema,
  convertCurrencyAmount,
  createTestExchangeRateSnapshot,
  DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
  getAnalyticsDisplayCurrencyRateToUsd,
  TEST_EXCHANGE_RATES_TO_USD,
  type AnalyticsDisplayCurrency,
  type ExchangeRateSnapshot,
  type ExchangeRatesToUsd,
} from "./currency-conversion.js";

export type AnalyticsSummaryQuery = {
  currency: string;
};

export type AnalyticsSummaryResponse = {
  currency: string;
  headcount: number;
  totalPayroll: number;
  exchangeRatesAsOf: string;
};

export type DepartmentSalaryStatistics = {
  department: string;
  employeeCount: number;
  averageSalary: number;
  medianSalary: number;
};

export type AnalyticsDepartmentStatisticsResponse = {
  currency: string;
  departments: DepartmentSalaryStatistics[];
  exchangeRatesAsOf: string;
};

export const ANALYTICS_TOP_EARNERS_LIMIT = 10;

export type TopEarner = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
};

export type AnalyticsTopEarnersResponse = {
  currency: string;
  earners: TopEarner[];
  exchangeRatesAsOf: string;
};

export type AnalyticsCurrenciesResponse = {
  currencies: string[];
  exchangeRatesAsOf: string;
  ratesToUsd: ExchangeRatesToUsd;
};
