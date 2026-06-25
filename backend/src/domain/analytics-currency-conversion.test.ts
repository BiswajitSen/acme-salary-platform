import { describe, expect, it } from "vitest";

import {
  convertCurrencyAmount,
  TEST_EXCHANGE_RATES_TO_USD,
} from "@acme/shared";

import {
  buildConvertedSalarySql,
  getCurrencyConversionMultiplier,
} from "./analytics-currency-conversion.js";

const testRates = TEST_EXCHANGE_RATES_TO_USD;

describe("getCurrencyConversionMultiplier", () => {
  it("returns one when source and display currencies match", () => {
    expect(getCurrencyConversionMultiplier("USD", "USD", testRates)).toBe(1);
  });

  it("matches the shared currency conversion helper", () => {
    expect(getCurrencyConversionMultiplier("GBP", "USD", testRates)).toBe(1.25);
    expect(convertCurrencyAmount(85_000, "GBP", "USD", testRates)).toBe(
      Math.round(85_000 * getCurrencyConversionMultiplier("GBP", "USD", testRates)),
    );
  });

  it("rejects unsupported display currencies", () => {
    expect(() => getCurrencyConversionMultiplier("USD", "AUD", testRates)).toThrow(
      "Unsupported analytics display currency",
    );
  });
});

describe("buildConvertedSalarySql", () => {
  it("builds a SQL fragment for each supported display currency", () => {
    expect(buildConvertedSalarySql("USD", testRates)).toBeTruthy();
    expect(buildConvertedSalarySql("GBP", testRates)).toBeTruthy();
  });

  it("rejects unsupported display currencies", () => {
    expect(() => buildConvertedSalarySql("AUD", testRates)).toThrow(
      "Unsupported analytics display currency",
    );
  });
});
