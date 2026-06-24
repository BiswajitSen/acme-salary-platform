import { describe, expect, it } from "vitest";

import { AI_INSIGHT_INTENTS, insightQueryRequestSchema } from "./ai-insights";

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
});

describe("AI_INSIGHT_INTENTS", () => {
  it("includes the analytics intents used by the parser", () => {
    expect(AI_INSIGHT_INTENTS).toContain("AVG_DEPT_SALARY");
    expect(AI_INSIGHT_INTENTS).toContain("TOP_EARNERS");
    expect(AI_INSIGHT_INTENTS).toContain("UNKNOWN");
  });
});
