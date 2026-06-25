import {
  ANALYTICS_DISPLAY_CURRENCIES,
  type ExchangeRatesToUsd,
} from "@acme/shared";

export function buildRatesToUsdFromFrankfurterResponse(response: {
  base: string;
  date: string;
  rates: Record<string, number>;
}): ExchangeRatesToUsd {
  if (response.base !== "USD") {
    throw new Error("Frankfurter responses must use USD as the base currency");
  }

  const ratesToUsd = {
    USD: 1,
  } as ExchangeRatesToUsd;

  for (const currency of ANALYTICS_DISPLAY_CURRENCIES) {
    if (currency === "USD") {
      continue;
    }

    const unitsPerUsd = response.rates[currency];

    if (unitsPerUsd === undefined || unitsPerUsd <= 0) {
      throw new Error(`Missing Frankfurter exchange rate for ${currency}`);
    }

    ratesToUsd[currency] = 1 / unitsPerUsd;
  }

  return ratesToUsd;
}
