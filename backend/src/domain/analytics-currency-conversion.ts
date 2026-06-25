import { sql, type SQL } from "drizzle-orm";

import {
  ANALYTICS_EXCHANGE_RATES_TO_USD,
  getAnalyticsDisplayCurrencyRateToUsd,
  type AnalyticsDisplayCurrency,
} from "@acme/shared";

export function getCurrencyConversionMultiplier(
  fromCurrency: string,
  displayCurrency: string,
): number {
  const fromRate = getAnalyticsDisplayCurrencyRateToUsd(fromCurrency);
  const displayRate = getAnalyticsDisplayCurrencyRateToUsd(displayCurrency);

  return fromRate / displayRate;
}

export function buildConvertedSalarySql(displayCurrency: string): SQL {
  const displayRate =
    ANALYTICS_EXCHANGE_RATES_TO_USD[displayCurrency as AnalyticsDisplayCurrency];

  if (displayRate === undefined) {
    throw new Error(`Unsupported analytics display currency: ${displayCurrency}`);
  }

  const conversionCases = Object.entries(ANALYTICS_EXCHANGE_RATES_TO_USD).map(
    ([currency, rateToUsd]) =>
      sql`WHEN ${currency} THEN lc.base_salary * ${rateToUsd / displayRate}`,
  );

  return sql`CASE lc.currency ${sql.join(conversionCases, sql` `)} ELSE lc.base_salary END`;
}
