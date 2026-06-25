export {
  ANALYTICS_DISPLAY_CURRENCIES,
  ANALYTICS_EXCHANGE_RATES_TO_USD,
  analyticsSummaryQuerySchema,
  convertCurrencyAmount,
  DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
  getAnalyticsDisplayCurrencyRateToUsd,
  type AnalyticsDisplayCurrency,
} from "./currency-conversion";

export type AnalyticsSummaryQuery = {
  currency: string;
};

export type AnalyticsSummaryResponse = {
  currency: string;
  headcount: number;
  totalPayroll: number;
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
};

export type AnalyticsCurrenciesResponse = {
  currencies: string[];
};
