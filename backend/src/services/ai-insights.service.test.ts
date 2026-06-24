import { describe, expect, it } from "vitest";

import { AiInsightsService } from "./ai-insights.service.js";

describe("AiInsightsService", () => {
  const service = new AiInsightsService();

  it("parses a natural language analytics question into an intent", () => {
    expect(service.parseQuery({ query: "average salary in Engineering" })).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "average salary in Engineering",
      department: "Engineering",
      currency: null,
    });
  });

  it("rejects invalid request bodies", () => {
    expect(() => service.parseQuery({ query: "" })).toThrow();
  });
});
