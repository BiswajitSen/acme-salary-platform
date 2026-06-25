import { describe, expect, it } from "vitest";

import {
  ANALYTICS_DISPLAY_CURRENCIES,
  convertCurrencyAmount,
  createTestExchangeRateSnapshot,
  DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
  getAnalyticsDisplayCurrencyRateToUsd,
  TEST_EXCHANGE_RATES_TO_USD,
} from "./currency-conversion";

const testRates = TEST_EXCHANGE_RATES_TO_USD;

describe("convertCurrencyAmount", () => {
  it("returns the same amount when converting within USD", () => {
    expect(convertCurrencyAmount(132_000, "USD", "USD", testRates)).toBe(132_000);
  });

  it("converts foreign amounts into the selected display currency", () => {
    expect(convertCurrencyAmount(85_000, "GBP", "USD", testRates)).toBe(106_250);
    expect(convertCurrencyAmount(132_000, "USD", "GBP", testRates)).toBe(105_600);
  });

  it("rejects unsupported currency codes", () => {
    expect(() => convertCurrencyAmount(100, "US", "USD", testRates)).toThrow(
      "Unsupported analytics display currency",
    );
  });
});

describe("analytics display currency config", () => {
  it("defines a default display currency for org-wide comparison", () => {
    expect(DEFAULT_ANALYTICS_DISPLAY_CURRENCY).toBe("USD");
  });

  it("includes exchange rates for every supported display currency", () => {
    for (const currency of ANALYTICS_DISPLAY_CURRENCIES) {
      expect(testRates[currency]).toBeGreaterThan(0);
      expect(getAnalyticsDisplayCurrencyRateToUsd(currency, testRates)).toBe(
        testRates[currency],
      );
    }
  });

  it("builds a deterministic test exchange rate snapshot", () => {
    expect(createTestExchangeRateSnapshot()).toEqual({
      asOf: "2026-01-01",
      ratesToUsd: testRates,
    });
  });
});
