import { describe, expect, it } from "vitest";

import { validateInsightExecutionSafety } from "./validate-execution.js";

describe("validateInsightExecutionSafety", () => {
  it("rejects SQL injection style input before execution", () => {
    expect(
      validateInsightExecutionSafety({
        intent: "HEADCOUNT",
        originalQuery: "headcount; DROP TABLE employees",
        department: null,
        country: null,
        currency: "USD",
      }),
    ).toEqual({
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    });
  });

  it("rejects departments outside the allowlist", () => {
    expect(
      validateInsightExecutionSafety({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in rogue dept",
        department: "Rogue Dept",
        country: null,
        currency: null,
      }),
    ).toEqual({
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    });
  });

  it("rejects invalid currency codes", () => {
    expect(
      validateInsightExecutionSafety({
        intent: "HEADCOUNT",
        originalQuery: "headcount",
        department: null,
        currency: "US",
      }),
    ).toEqual({
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    });
  });

  it("allows safe parsed insight queries", () => {
    expect(
      validateInsightExecutionSafety({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in Engineering",
        department: "Engineering",
        country: null,
        jobTitle: null,
        currency: "USD",
        months: null,
        sinceDate: null,
        limit: null,
        medianSplitFocus: null,
      }),
    ).toBeNull();
  });

  it("rejects countries outside the allowlist", () => {
    expect(
      validateInsightExecutionSafety({
        intent: "HEADCOUNT",
        originalQuery: "headcount in XX",
        department: null,
        country: "XX",
        jobTitle: null,
        currency: "USD",
        months: null,
        sinceDate: null,
        limit: null,
        medianSplitFocus: null,
      }),
    ).toEqual({
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    });
  });

  it("rejects empty or oversized job titles", () => {
    expect(
      validateInsightExecutionSafety({
        intent: "HEADCOUNT",
        originalQuery: "headcount",
        department: null,
        country: null,
        jobTitle: "   ",
        currency: "USD",
        months: null,
        sinceDate: null,
        limit: null,
        medianSplitFocus: null,
      }),
    ).toEqual({
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    });
  });

  it("rejects ranked limits outside the supported range", () => {
    expect(
      validateInsightExecutionSafety({
        intent: "TOP_EARNERS",
        originalQuery: "top 0 earners",
        department: null,
        country: null,
        jobTitle: null,
        currency: "USD",
        months: null,
        sinceDate: null,
        limit: 0,
        medianSplitFocus: null,
      }),
    ).toEqual({
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    });
  });

  it("rejects job titles longer than one hundred characters", () => {
    expect(
      validateInsightExecutionSafety({
        intent: "HEADCOUNT",
        originalQuery: "headcount",
        department: null,
        country: null,
        jobTitle: "A".repeat(101),
        currency: "USD",
        months: null,
        sinceDate: null,
        limit: null,
        medianSplitFocus: null,
      }),
    ).toEqual({
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    });
  });
});
