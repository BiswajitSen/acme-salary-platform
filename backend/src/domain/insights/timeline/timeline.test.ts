import { describe, expect, it } from "vitest";

import {
  isInsightTimelineIntent,
  resolveInsightTimelineMonths,
  resolveTimelineReasons,
} from "./timeline.js";
import { extractInsightTimelineWindow } from "./window.js";

describe("timeline", () => {
  it("recognizes timeline intents", () => {
    expect(isInsightTimelineIntent("RECENT_NEW_HIRES")).toBe(true);
    expect(isInsightTimelineIntent("RECENT_SALARY_INCREASES")).toBe(true);
    expect(isInsightTimelineIntent("HEADCOUNT")).toBe(false);
  });

  it("extracts month windows from natural language", () => {
    expect(extractInsightTimelineWindow("employees who joined after 6 months").months).toBe(6);
    expect(extractInsightTimelineWindow("new joiners in the last 3 months").months).toBe(3);
    expect(extractInsightTimelineWindow("promotions since 2025-06-01").sinceDate).toBe("2025-06-01");
  });

  it("defaults timeline intents to three months", () => {
    expect(resolveInsightTimelineMonths("RECENT_NEW_HIRES", "new joiners recently")).toBe(3);
  });

  it("overrides timeline reasons when the query mentions an explicit compensation reason", () => {
    expect(
      resolveTimelineReasons(
        "RECENT_SALARY_INCREASES",
        "market adjustments in the last 3 months",
      ),
    ).toEqual(["Market Adjustment"]);
  });

  it("uses intent defaults when no explicit compensation reason is mentioned", () => {
    expect(
      resolveTimelineReasons("RECENT_NEW_HIRES", "employees in the last 3 months"),
    ).toEqual(["New Hire"]);
  });

  it("returns null months for non-timeline intents", () => {
    expect(resolveInsightTimelineMonths("HEADCOUNT", "headcount")).toBeNull();
  });
});
