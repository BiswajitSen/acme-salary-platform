import { z } from "zod";

export const ANALYTICS_DISPLAY_CURRENCIES = ["USD", "GBP", "EUR", "INR", "SGD"] as const;

export type AnalyticsDisplayCurrency = (typeof ANALYTICS_DISPLAY_CURRENCIES)[number];

export const DEFAULT_ANALYTICS_DISPLAY_CURRENCY: AnalyticsDisplayCurrency = "USD";

export type ExchangeRatesToUsd = Record<AnalyticsDisplayCurrency, number>;

export type ExchangeRateSnapshot = {
  asOf: string;
  ratesToUsd: ExchangeRatesToUsd;
};

export const TEST_EXCHANGE_RATES_TO_USD = {
  USD: 1,
  GBP: 1.25,
  EUR: 1.1,
  INR: 0.012,
  SGD: 0.75,
} as const satisfies ExchangeRatesToUsd;

export function createTestExchangeRateSnapshot(
  asOf = "2026-01-01",
): ExchangeRateSnapshot {
  return {
    asOf,
    ratesToUsd: { ...TEST_EXCHANGE_RATES_TO_USD },
  };
}

export function getAnalyticsDisplayCurrencyRateToUsd(
  currency: string,
  ratesToUsd: ExchangeRatesToUsd,
): number {
  const rate = ratesToUsd[currency as AnalyticsDisplayCurrency];

  if (rate === undefined) {
    throw new Error(`Unsupported analytics display currency: ${currency}`);
  }

  return rate;
}

export function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  ratesToUsd: ExchangeRatesToUsd,
): number {
  const fromRate = getAnalyticsDisplayCurrencyRateToUsd(fromCurrency, ratesToUsd);
  const toRate = getAnalyticsDisplayCurrencyRateToUsd(toCurrency, ratesToUsd);

  return Math.round((amount * fromRate) / toRate);
}

export const analyticsDisplayCurrencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a 3-letter ISO 4217 code")
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO 4217 code")
  .transform((value) => value.toUpperCase())
  .refine(
    (value): value is AnalyticsDisplayCurrency =>
      ANALYTICS_DISPLAY_CURRENCIES.includes(value as AnalyticsDisplayCurrency),
    "Currency must be a supported analytics display currency",
  );

export const analyticsSummaryQuerySchema = z.object({
  currency: analyticsDisplayCurrencySchema,
});
