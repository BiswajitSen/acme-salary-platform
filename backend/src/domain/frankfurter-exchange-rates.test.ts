import { describe, expect, it } from "vitest";

import { buildRatesToUsdFromFrankfurterResponse } from "./frankfurter-exchange-rates.js";

describe("buildRatesToUsdFromFrankfurterResponse", () => {
  it("converts Frankfurter USD-base rates into rate-to-USD multipliers", () => {
    expect(
      buildRatesToUsdFromFrankfurterResponse({
        base: "USD",
        date: "2026-06-24",
        rates: {
          GBP: 0.8,
          EUR: 0.5,
          INR: 80,
          SGD: 1.25,
        },
      }),
    ).toEqual({
      USD: 1,
      GBP: 1.25,
      EUR: 2,
      INR: 0.0125,
      SGD: 0.8,
    });
  });

  it("rejects responses that are not USD-based", () => {
    expect(() =>
      buildRatesToUsdFromFrankfurterResponse({
        base: "EUR",
        date: "2026-06-24",
        rates: { USD: 1.1 },
      }),
    ).toThrow("USD as the base currency");
  });

  it("rejects missing or invalid currency rates", () => {
    expect(() =>
      buildRatesToUsdFromFrankfurterResponse({
        base: "USD",
        date: "2026-06-24",
        rates: {
          GBP: 0.8,
          EUR: 0.5,
          INR: 80,
        },
      }),
    ).toThrow("Missing Frankfurter exchange rate for SGD");
  });

  it("rejects zero or negative currency rates", () => {
    expect(() =>
      buildRatesToUsdFromFrankfurterResponse({
        base: "USD",
        date: "2026-06-24",
        rates: {
          GBP: 0,
          EUR: 0.5,
          INR: 80,
          SGD: 1.25,
        },
      }),
    ).toThrow("Missing Frankfurter exchange rate for GBP");
  });
});
