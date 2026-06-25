import { describe, expect, it } from "vitest";

import {
  ANALYTICS_DISPLAY_CURRENCIES,
  ANALYTICS_EXCHANGE_RATES_TO_USD,
  convertCurrencyAmount,
  DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
  getAnalyticsDisplayCurrencyRateToUsd,
} from "./currency-conversion";

describe("convertCurrencyAmount", () => {
  it("returns the same amount when converting within USD", () => {
    expect(convertCurrencyAmount(132_000, "USD", "USD")).toBe(132_000);
  });

  it("converts foreign amounts into the selected display currency", () => {
    expect(convertCurrencyAmount(85_000, "GBP", "USD")).toBe(106_250);
    expect(convertCurrencyAmount(132_000, "USD", "GBP")).toBe(105_600);
  });

  it("rejects unsupported currency codes", () => {
    expect(() => convertCurrencyAmount(100, "US", "USD")).toThrow(
      "Unsupported currency conversion",
    );
  });
});

describe("analytics display currency config", () => {
  it("defines a default display currency for org-wide comparison", () => {
    expect(DEFAULT_ANALYTICS_DISPLAY_CURRENCY).toBe("USD");
  });

  it("includes exchange rates for every supported display currency", () => {
    for (const currency of ANALYTICS_DISPLAY_CURRENCIES) {
      expect(ANALYTICS_EXCHANGE_RATES_TO_USD[currency]).toBeGreaterThan(0);
      expect(getAnalyticsDisplayCurrencyRateToUsd(currency)).toBe(
        ANALYTICS_EXCHANGE_RATES_TO_USD[currency],
      );
    }
  });
});
