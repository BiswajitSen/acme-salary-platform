import { describe, expect, it } from "vitest";

import { parseAnalyticsCurrencyQuery } from "./analytics-query.js";

describe("parseAnalyticsCurrencyQuery", () => {
  it("normalizes a valid currency code", () => {
    expect(parseAnalyticsCurrencyQuery({ currency: "usd" })).toBe("USD");
  });

  it("rejects invalid currency codes", () => {
    expect(() => parseAnalyticsCurrencyQuery({ currency: "US" })).toThrow();
  });
});
