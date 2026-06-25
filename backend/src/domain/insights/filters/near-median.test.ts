import { describe, expect, it } from "vitest";

import { DEFAULT_INSIGHT_NEAR_MEDIAN_TOLERANCE_PERCENT } from "@acme/shared";

import {
  extractNearMedianTolerancePercent,
  resolveNearMedianTolerancePercent,
} from "./near-median.js";

describe("extractNearMedianTolerancePercent", () => {
  it("parses tolerance percentages from natural language", () => {
    expect(extractNearMedianTolerancePercent("who earn within 15% of the median")).toBe(15);
    expect(extractNearMedianTolerancePercent("employees around 20 percent median")).toBe(20);
    expect(extractNearMedianTolerancePercent("near 5% median")).toBe(5);
  });

  it("caps tolerance at fifty percent", () => {
    expect(extractNearMedianTolerancePercent("within 80% of median")).toBe(50);
  });

  it("returns null when no tolerance is mentioned", () => {
    expect(extractNearMedianTolerancePercent("who earn around the median")).toBeNull();
  });

  it("returns null for non-positive tolerances", () => {
    expect(extractNearMedianTolerancePercent("within 0% of median")).toBeNull();
  });
});

describe("resolveNearMedianTolerancePercent", () => {
  it("defaults to the shared tolerance when none is specified", () => {
    expect(resolveNearMedianTolerancePercent("near median earners")).toBe(
      DEFAULT_INSIGHT_NEAR_MEDIAN_TOLERANCE_PERCENT,
    );
  });
});
