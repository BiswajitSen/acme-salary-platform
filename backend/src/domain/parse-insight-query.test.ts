import { describe, expect, it } from "vitest";

import { parseInsightQuery } from "./parse-insight-query.js";

describe("parseInsightQuery", () => {
  it("maps average department salary questions to AVG_DEPT_SALARY", () => {
    expect(parseInsightQuery("What is the average salary in Engineering?")).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "What is the average salary in Engineering?",
      department: "Engineering",
      country: null,
      currency: null,
      months: null,
    });
  });

  it("recognizes shorthand average salary phrasing", () => {
    expect(parseInsightQuery("avg salary in Engineering")).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "avg salary in Engineering",
      department: "Engineering",
      country: null,
      currency: null,
      months: null,
    });
  });

  it("extracts an optional currency from the query", () => {
    expect(parseInsightQuery("average salary in Engineering in USD")).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "average salary in Engineering in USD",
      department: "Engineering",
      country: null,
      currency: "USD",
      months: null,
    });
  });

  it("maps promotion questions to RECENT_PROMOTIONS", () => {
    expect(parseInsightQuery("List employees who got promotion in the last 3months")).toEqual({
      intent: "RECENT_PROMOTIONS",
      originalQuery: "List employees who got promotion in the last 3months",
      department: null,
      country: null,
      currency: null,
      months: 3,
    });
  });

  it("defaults promotion lookback to three months when no window is specified", () => {
    expect(parseInsightQuery("Who was promoted recently?")).toEqual({
      intent: "RECENT_PROMOTIONS",
      originalQuery: "Who was promoted recently?",
      department: null,
      country: null,
      currency: null,
      months: 3,
    });
  });

  it("extracts an optional country filter from promotion questions", () => {
    expect(parseInsightQuery("employees promoted in India in the last 6 months")).toEqual({
      intent: "RECENT_PROMOTIONS",
      originalQuery: "employees promoted in India in the last 6 months",
      department: null,
      country: "IN",
      currency: null,
      months: 6,
    });
  });

  it("maps new joiner questions to RECENT_NEW_HIRES", () => {
    expect(parseInsightQuery("new joiners in the last 6 months")).toEqual({
      intent: "RECENT_NEW_HIRES",
      originalQuery: "new joiners in the last 6 months",
      department: null,
      country: null,
      currency: null,
      months: 6,
    });
  });

  it("maps joined-as-department questions to RECENT_NEW_HIRES", () => {
    expect(parseInsightQuery("employees who joined as engineers in the last 12 months")).toEqual({
      intent: "RECENT_NEW_HIRES",
      originalQuery: "employees who joined as engineers in the last 12 months",
      department: "Engineering",
      country: null,
      currency: null,
      months: 12,
    });
  });

  it("maps salary hike questions to RECENT_SALARY_INCREASES", () => {
    expect(parseInsightQuery("employees in India who got salary hike in the last 3 months")).toEqual(
      {
        intent: "RECENT_SALARY_INCREASES",
        originalQuery: "employees in India who got salary hike in the last 3 months",
        department: null,
        country: "IN",
        currency: null,
        months: 3,
      },
    );
  });

  it("maps median department salary questions to MEDIAN_DEPT_SALARY", () => {
    expect(parseInsightQuery("median salary in HR")).toEqual({
      intent: "MEDIAN_DEPT_SALARY",
      originalQuery: "median salary in HR",
      department: "HR",
      country: null,
      currency: null,
      months: null,
    });
  });

  it("maps headcount questions to HEADCOUNT", () => {
    expect(parseInsightQuery("What is the headcount in GBP?")).toEqual({
      intent: "HEADCOUNT",
      originalQuery: "What is the headcount in GBP?",
      department: null,
      country: null,
      currency: "GBP",
      months: null,
    });
  });

  it("recognizes alternate headcount phrasing", () => {
    expect(parseInsightQuery("How many employees are in USD?")).toEqual({
      intent: "HEADCOUNT",
      originalQuery: "How many employees are in USD?",
      department: null,
      country: null,
      currency: "USD",
      months: null,
    });
  });

  it("maps payroll questions to TOTAL_PAYROLL", () => {
    expect(parseInsightQuery("total payroll in USD")).toEqual({
      intent: "TOTAL_PAYROLL",
      originalQuery: "total payroll in USD",
      department: null,
      country: null,
      currency: "USD",
      months: null,
    });
  });

  it("maps top earner questions to TOP_EARNERS", () => {
    expect(parseInsightQuery("Who are the top earners in INR?")).toEqual({
      intent: "TOP_EARNERS",
      originalQuery: "Who are the top earners in INR?",
      department: null,
      country: null,
      currency: "INR",
      months: null,
    });
  });

  it("extracts employee country filters from country names", () => {
    expect(parseInsightQuery("Who are the top earners in INDIA?")).toEqual({
      intent: "TOP_EARNERS",
      originalQuery: "Who are the top earners in INDIA?",
      department: null,
      country: "IN",
      currency: null,
      months: null,
    });
  });

  it("extracts combined department and country filters from payroll questions", () => {
    expect(parseInsightQuery("Total payroll for Engineering in Inida?")).toEqual({
      intent: "TOTAL_PAYROLL",
      originalQuery: "Total payroll for Engineering in Inida?",
      department: "Engineering",
      country: "IN",
      currency: null,
      months: null,
    });
  });

  it("extracts country filters from for-country payroll questions", () => {
    expect(parseInsightQuery("total payroll for UK")).toEqual({
      intent: "TOTAL_PAYROLL",
      originalQuery: "total payroll for UK",
      department: null,
      country: "UK",
      currency: null,
      months: null,
    });
    expect(parseInsightQuery("total payroll for USA")).toEqual({
      intent: "TOTAL_PAYROLL",
      originalQuery: "total payroll for USA",
      department: null,
      country: "US",
      currency: null,
      months: null,
    });
  });

  it("returns UNKNOWN when a salary intent has no department or country scope", () => {
    expect(parseInsightQuery("What is the average salary?")).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "What is the average salary?",
      department: null,
      country: null,
      currency: null,
      months: null,
    });
  });

  it("extracts country-scoped average salary questions", () => {
    expect(parseInsightQuery("What is the average salary in India?")).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "What is the average salary in India?",
      department: null,
      country: "IN",
      currency: null,
      months: null,
    });
  });

  it("returns UNKNOWN for unsupported questions", () => {
    expect(parseInsightQuery("Tell me a joke about payroll")).toEqual({
      intent: "UNKNOWN",
      originalQuery: "Tell me a joke about payroll",
      department: null,
      country: null,
      currency: null,
      months: null,
    });
  });

  it("returns UNKNOWN for SQL injection style input", () => {
    expect(parseInsightQuery("average salary; DROP TABLE employees")).toEqual({
      intent: "UNKNOWN",
      originalQuery: "average salary; DROP TABLE employees",
      department: null,
      country: null,
      currency: null,
      months: null,
    });
  });
});
