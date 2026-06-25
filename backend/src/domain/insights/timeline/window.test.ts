import { describe, expect, it } from "vitest";

import {
  buildTimelineStartExpression,
  extractInsightTimelineWindow,
  resolveInsightTimelineWindow,
} from "./window.js";

describe("extractInsightTimelineWindow", () => {
  it("extracts week-based windows as month equivalents", () => {
    expect(extractInsightTimelineWindow("new joiners in the last 8 weeks").months).toBe(2);
  });

  it("extracts year-based windows as months", () => {
    expect(extractInsightTimelineWindow("promotions in the last 2 years").months).toBe(24);
  });

  it("parses month-year since dates", () => {
    expect(extractInsightTimelineWindow("hires since June 2025").sinceDate).toBe("2025-06-01");
  });
});

describe("resolveInsightTimelineWindow", () => {
  it("returns empty windows for non-timeline intents", () => {
    expect(resolveInsightTimelineWindow("headcount in engineering", false)).toEqual({
      months: null,
      sinceDate: null,
    });
  });

  it("defaults timeline intents without explicit windows to three months", () => {
    expect(resolveInsightTimelineWindow("recent promotions", true)).toEqual({
      months: 3,
      sinceDate: null,
    });
  });
});

describe("buildTimelineStartExpression", () => {
  it("uses sinceDate when provided", () => {
    const expression = buildTimelineStartExpression("2026-01-01", {
      months: null,
      sinceDate: "2025-06-01",
    });

    expect(expression.queryChunks.join(" ")).toContain("2025-06-01");
  });

  it("uses month lookback when sinceDate is absent", () => {
    const expression = buildTimelineStartExpression("2026-01-01", {
      months: 6,
      sinceDate: null,
    });

    expect(expression.queryChunks.join(" ")).toContain("6");
  });
});
