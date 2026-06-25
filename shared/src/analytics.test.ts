import { describe, expect, it } from "vitest";

import { analyticsSummaryQuerySchema } from "./analytics";

describe("analyticsSummaryQuerySchema", () => {
  it("requires a three-letter ISO currency code", () => {
    expect(analyticsSummaryQuerySchema.parse({ currency: "usd" })).toEqual({
      currency: "USD",
    });
  });

  it("rejects invalid currency codes", () => {
    expect(() => analyticsSummaryQuerySchema.parse({ currency: "US" })).toThrow();
    expect(() => analyticsSummaryQuerySchema.parse({ currency: "USDD" })).toThrow();
  });

  it("rejects unsupported display currencies", () => {
    expect(() => analyticsSummaryQuerySchema.parse({ currency: "AUD" })).toThrow();
  });
});
