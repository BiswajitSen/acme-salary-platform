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

  it("extracts explicit title phrasing via joined-as", () => {
    expect(
      extractInsightJobTitle(
        "headcount for employees who joined as Staff Engineer",
        "headcount for employees who joined as staff engineer",
      ),
    ).toBe("Staff Engineer");
  });

  it("does not treat department names as job titles", () => {
    expect(
      extractInsightJobTitle("average salary in engineering", "average salary in engineering"),
    ).toBeNull();
  });
});
