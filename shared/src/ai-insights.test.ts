import { describe, expect, it } from "vitest";

import {
  AI_INSIGHT_INTENTS,
  DEFAULT_INSIGHT_CURRENCY,
  INSIGHT_EXECUTION_ERROR_KINDS,
  insightQueryRequestSchema,
} from "./ai-insights";

describe("insightQueryRequestSchema", () => {
  it("requires a non-empty query string", () => {
    expect(insightQueryRequestSchema.parse({ query: "average salary in Engineering" })).toEqual({
      query: "average salary in Engineering",
    });
  });

  it("rejects blank queries", () => {
    expect(() => insightQueryRequestSchema.parse({ query: "   " })).toThrow();
  });

  it("rejects queries longer than five hundred characters", () => {
    expect(() =>
      insightQueryRequestSchema.parse({ query: "a".repeat(501) }),
    ).toThrow();
  });

  it("accepts an optional display currency override", () => {
    expect(
      insightQueryRequestSchema.parse({
        query: "headcount",
        displayCurrency: "gbp",
      }),
    ).toEqual({
      query: "headcount",
      displayCurrency: "GBP",
    });
  });

  it("rejects unsupported display currencies", () => {
    expect(() =>
      insightQueryRequestSchema.parse({
        query: "headcount",
        displayCurrency: "XYZ",
      }),
    ).toThrow();
  });
});

describe("AI_INSIGHT_INTENTS", () => {
  it("includes the analytics intents used by the parser", () => {
    expect(AI_INSIGHT_INTENTS).toContain("AVG_DEPT_SALARY");
    expect(AI_INSIGHT_INTENTS).toContain("TOP_EARNERS");
    expect(AI_INSIGHT_INTENTS).toContain("UNKNOWN");
  });
});

describe("insight execution contracts", () => {
  it("defines a default currency for queries without one", () => {
    expect(DEFAULT_INSIGHT_CURRENCY).toBe("USD");
  });

  it("includes execution error kinds for unsupported and missing data cases", () => {
    expect(INSIGHT_EXECUTION_ERROR_KINDS).toContain("UNSUPPORTED_INTENT");
    expect(INSIGHT_EXECUTION_ERROR_KINDS).toContain("DEPARTMENT_NOT_FOUND");
    expect(INSIGHT_EXECUTION_ERROR_KINDS).toContain("COUNTRY_NOT_FOUND");
    expect(INSIGHT_EXECUTION_ERROR_KINDS).toContain("REJECTED_INPUT");
  });
});
