import { describe, expect, it } from "vitest";

import { ANALYTICS_TOP_EARNERS_LIMIT } from "@acme/shared";

import {
  extractInsightBottomLimit,
  extractInsightTopLimit,
  INSIGHT_MAX_RANKED_EARNERS_LIMIT,
  resolveInsightBottomLimit,
  resolveInsightTopLimit,
} from "./ranked-limits.js";

describe("extractInsightTopLimit", () => {
  it("parses explicit top-N limits", () => {
    expect(extractInsightTopLimit("who are the top 5 earners?")).toBe(5);
  });

  it("caps limits at the configured maximum", () => {
    expect(extractInsightTopLimit("top 100 earners")).toBe(INSIGHT_MAX_RANKED_EARNERS_LIMIT);
  });

  it("returns null when no limit is present", () => {
    expect(extractInsightTopLimit("top earners in engineering")).toBeNull();
  });

  it("returns null for non-positive limits", () => {
    expect(extractInsightTopLimit("top 0 earners")).toBeNull();
  });
});

describe("extractInsightBottomLimit", () => {
  it("parses bottom, least, and lowest phrasing", () => {
    expect(extractInsightBottomLimit("bottom 3 earners")).toBe(3);
    expect(extractInsightBottomLimit("least 4 earners")).toBe(4);
    expect(extractInsightBottomLimit("lowest 2 earners")).toBe(2);
  });
});

describe("resolveInsightTopLimit", () => {
  it("falls back to the shared default when no limit is present", () => {
    expect(resolveInsightTopLimit("top earners")).toBe(ANALYTICS_TOP_EARNERS_LIMIT);
  });
});

describe("resolveInsightBottomLimit", () => {
  it("falls back to the shared default when no limit is present", () => {
    expect(resolveInsightBottomLimit("least earners")).toBe(ANALYTICS_TOP_EARNERS_LIMIT);
  });
});
