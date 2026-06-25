import { describe, expect, it } from "vitest";

import {
  extractInsightTimelineMonths,
  isInsightTimelineIntent,
  resolveInsightTimelineMonths,
} from "./insight-query-timeline.js";

describe("insight-query-timeline", () => {
  it("recognizes timeline intents", () => {
    expect(isInsightTimelineIntent("RECENT_NEW_HIRES")).toBe(true);
    expect(isInsightTimelineIntent("RECENT_SALARY_INCREASES")).toBe(true);
    expect(isInsightTimelineIntent("HEADCOUNT")).toBe(false);
  });

  it("extracts month windows from natural language", () => {
    expect(extractInsightTimelineMonths("employees who joined after 6 months")).toBe(6);
    expect(extractInsightTimelineMonths("new joiners in the last 3 months")).toBe(3);
  });

  it("defaults timeline intents to three months", () => {
    expect(resolveInsightTimelineMonths("RECENT_NEW_HIRES", "new joiners recently")).toBe(3);
  });
});
