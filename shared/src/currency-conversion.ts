import { z } from "zod";

export const ANALYTICS_DISPLAY_CURRENCIES = ["USD", "GBP", "EUR", "INR", "SGD"] as const;

export type AnalyticsDisplayCurrency = (typeof ANALYTICS_DISPLAY_CURRENCIES)[number];

export const DEFAULT_ANALYTICS_DISPLAY_CURRENCY: AnalyticsDisplayCurrency = "USD";

export const ANALYTICS_EXCHANGE_RATES_TO_USD = {
  USD: 1,
  GBP: 1.25,
  EUR: 1.1,
  INR: 0.012,
  SGD: 0.75,
} as const satisfies Record<AnalyticsDisplayCurrency, number>;

export function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number {
  const fromRate =
    ANALYTICS_EXCHANGE_RATES_TO_USD[fromCurrency as AnalyticsDisplayCurrency];
  const toRate = ANALYTICS_EXCHANGE_RATES_TO_USD[toCurrency as AnalyticsDisplayCurrency];

  if (fromRate === undefined || toRate === undefined) {
    throw new Error(`Unsupported currency conversion: ${fromCurrency} -> ${toCurrency}`);
  }

  return Math.round((amount * fromRate) / toRate);
}

export function getAnalyticsDisplayCurrencyRateToUsd(currency: string): number {
  const rate = ANALYTICS_EXCHANGE_RATES_TO_USD[currency as AnalyticsDisplayCurrency];

  if (rate === undefined) {
    throw new Error(`Unsupported analytics display currency: ${currency}`);
  }

  return rate;
}

export const analyticsSummaryQuerySchema = z.object({
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO 4217 code")
    .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO 4217 code")
    .transform((value) => value.toUpperCase())
    .refine(
      (value): value is AnalyticsDisplayCurrency =>
        ANALYTICS_DISPLAY_CURRENCIES.includes(value as AnalyticsDisplayCurrency),
      "Currency must be a supported analytics display currency",
    ),
});
