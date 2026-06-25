import { describe, expect, it } from "vitest";

import { convertCurrencyAmount } from "@acme/shared";

import {
  buildConvertedSalarySql,
  getCurrencyConversionMultiplier,
} from "./analytics-currency-conversion.js";

describe("getCurrencyConversionMultiplier", () => {
  it("returns one when source and display currencies match", () => {
    expect(getCurrencyConversionMultiplier("USD", "USD")).toBe(1);
  });

  it("matches the shared currency conversion helper", () => {
    expect(getCurrencyConversionMultiplier("GBP", "USD")).toBe(1.25);
    expect(convertCurrencyAmount(85_000, "GBP", "USD")).toBe(
      Math.round(85_000 * getCurrencyConversionMultiplier("GBP", "USD")),
    );
  });

  it("rejects unsupported display currencies", () => {
    expect(() => getCurrencyConversionMultiplier("USD", "AUD")).toThrow(
      "Unsupported analytics display currency",
    );
  });
});

describe("buildConvertedSalarySql", () => {
  it("builds a SQL fragment for each supported display currency", () => {
    expect(buildConvertedSalarySql("USD")).toBeTruthy();
    expect(buildConvertedSalarySql("GBP")).toBeTruthy();
  });

  it("rejects unsupported display currencies", () => {
    expect(() => buildConvertedSalarySql("AUD")).toThrow(
      "Unsupported analytics display currency",
    );
  });
});
