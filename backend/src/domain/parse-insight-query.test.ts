import { describe, expect, it } from "vitest";

import { parseInsightQuery } from "./parse-insight-query.js";

describe("parseInsightQuery", () => {
  it("maps average department salary questions to AVG_DEPT_SALARY", () => {
    expect(parseInsightQuery("What is the average salary in Engineering?")).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "What is the average salary in Engineering?",
      department: "Engineering",
      currency: null,
    });
  });

  it("recognizes shorthand average salary phrasing", () => {
    expect(parseInsightQuery("avg salary in Engineering")).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "avg salary in Engineering",
      department: "Engineering",
      currency: null,
    });
  });

  it("extracts an optional currency from the query", () => {
    expect(parseInsightQuery("average salary in Engineering in USD")).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "average salary in Engineering in USD",
      department: "Engineering",
      currency: "USD",
    });
  });

  it("maps median department salary questions to MEDIAN_DEPT_SALARY", () => {
    expect(parseInsightQuery("median salary in HR")).toEqual({
      intent: "MEDIAN_DEPT_SALARY",
      originalQuery: "median salary in HR",
      department: "HR",
      currency: null,
    });
  });

  it("maps headcount questions to HEADCOUNT", () => {
    expect(parseInsightQuery("What is the headcount in GBP?")).toEqual({
      intent: "HEADCOUNT",
      originalQuery: "What is the headcount in GBP?",
      department: null,
      currency: "GBP",
    });
  });

  it("maps payroll questions to TOTAL_PAYROLL", () => {
    expect(parseInsightQuery("total payroll in USD")).toEqual({
      intent: "TOTAL_PAYROLL",
      originalQuery: "total payroll in USD",
      department: null,
      currency: "USD",
    });
  });

  it("maps top earner questions to TOP_EARNERS", () => {
    expect(parseInsightQuery("Who are the top earners in INR?")).toEqual({
      intent: "TOP_EARNERS",
      originalQuery: "Who are the top earners in INR?",
      department: null,
      currency: "INR",
    });
  });

  it("returns UNKNOWN when a department salary intent has no department", () => {
    expect(parseInsightQuery("What is the average salary?")).toEqual({
      intent: "UNKNOWN",
      originalQuery: "What is the average salary?",
      department: null,
      currency: null,
    });
  });

  it("returns UNKNOWN for unsupported questions", () => {
    expect(parseInsightQuery("Tell me a joke about payroll")).toEqual({
      intent: "UNKNOWN",
      originalQuery: "Tell me a joke about payroll",
      department: null,
      currency: null,
    });
  });

  it("returns UNKNOWN for SQL injection style input", () => {
    expect(parseInsightQuery("average salary; DROP TABLE employees")).toEqual({
      intent: "UNKNOWN",
      originalQuery: "average salary; DROP TABLE employees",
      department: null,
      currency: null,
    });
  });
});
