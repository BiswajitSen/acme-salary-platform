import { sql, type SQL } from "drizzle-orm";

import {
  getAnalyticsDisplayCurrencyRateToUsd,
  type ExchangeRatesToUsd,
} from "@acme/shared";

export function getCurrencyConversionMultiplier(
  fromCurrency: string,
  displayCurrency: string,
  ratesToUsd: ExchangeRatesToUsd,
): number {
  const fromRate = getAnalyticsDisplayCurrencyRateToUsd(fromCurrency, ratesToUsd);
  const displayRate = getAnalyticsDisplayCurrencyRateToUsd(displayCurrency, ratesToUsd);

  return fromRate / displayRate;
}

export function buildConvertedSalarySql(
  displayCurrency: string,
  ratesToUsd: ExchangeRatesToUsd,
): SQL {
  const displayRate = getAnalyticsDisplayCurrencyRateToUsd(displayCurrency, ratesToUsd);

  const conversionCases = Object.entries(ratesToUsd).map(
    ([currency, rateToUsd]) =>
      sql`WHEN ${currency} THEN lc.base_salary * ${rateToUsd / displayRate}`,
  );

  return sql`CASE lc.currency ${sql.join(conversionCases, sql` `)} ELSE lc.base_salary END`;
}
