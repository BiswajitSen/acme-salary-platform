import { describe, expect, it } from "vitest";

import { extractInsightJobTitle, extractJoinedAsScope } from "./job-title.js";

describe("extractJoinedAsScope", () => {
  it("maps joined-as department phrases to departments", () => {
    expect(
      extractJoinedAsScope(
        "new hires who joined as HR in the last 3 months",
        "new hires who joined as hr in the last 3 months",
      ),
    ).toEqual({ department: "HR", jobTitle: null });
  });

  it("treats non-department joined-as phrases as job titles", () => {
    expect(
      extractJoinedAsScope(
        "employees who joined as Senior Engineer in the last 6 months",
        "employees who joined as senior engineer in the last 6 months",
      ),
    ).toEqual({ department: null, jobTitle: "Senior Engineer" });
  });
});

describe("extractInsightJobTitle", () => {
  it("prefers joined-as job titles", () => {
    expect(
      extractInsightJobTitle(
        "recent hires who joined as Data Analyst",
        "recent hires who joined as data analyst",
      ),
    ).toBe("Data Analyst");
  });

  it("extracts explicit title phrasing", () => {
    expect(
      extractInsightJobTitle(
        "headcount with title Data Analyst",
        "headcount with title data analyst",
      ),
    ).toBe("data analyst");
  });

  it("skips short department-like title candidates", () => {
    expect(extractInsightJobTitle("headcount as hr", "headcount as hr")).toBeNull();
  });
});
