import { describe, expect, it } from "vitest";

import { executeInsightQuery, parseInsightQuery } from "./ai-insights";

describe("parseInsightQuery", () => {
  it("posts a natural language query to the insights parser API", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input, init) => {
      expect(String(input)).toBe("/api/backend/insights/parse");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(
        JSON.stringify({ query: "average salary in Engineering" }),
      );

      return new Response(
        JSON.stringify({
          intent: "AVG_DEPT_SALARY",
          originalQuery: "average salary in Engineering",
          department: "Engineering",
          currency: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(parseInsightQuery("average salary in Engineering")).resolves.toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "average salary in Engineering",
      department: "Engineering",
      currency: null,
    });
    global.fetch = originalFetch;
  });
});

describe("executeInsightQuery", () => {
  it("posts a natural language query to the insights execute API", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input, init) => {
      expect(String(input)).toBe("/api/backend/insights/execute");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(
        JSON.stringify({ query: "headcount in USD" }),
      );

      return new Response(
        JSON.stringify({
          parsedQuery: {
            intent: "HEADCOUNT",
            originalQuery: "headcount in USD",
            department: null,
            currency: "USD",
          },
          result: {
            intent: "HEADCOUNT",
            currency: "USD",
            headcount: 42,
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(executeInsightQuery("headcount in USD")).resolves.toEqual({
      parsedQuery: {
        intent: "HEADCOUNT",
        originalQuery: "headcount in USD",
        department: null,
        currency: "USD",
      },
      result: {
        intent: "HEADCOUNT",
        currency: "USD",
        headcount: 42,
      },
      error: null,
    });
    global.fetch = originalFetch;
  });
});
