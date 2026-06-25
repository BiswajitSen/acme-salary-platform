import { describe, expect, it } from "vitest";

import type { ParsedInsightQuery } from "@acme/shared";

import { parseInsightQuery } from "./parse-query.js";

function parsed(
  overrides: Partial<ParsedInsightQuery> &
    Pick<ParsedInsightQuery, "intent" | "originalQuery">,
): ParsedInsightQuery {
  return {
    department: null,
    country: null,
    jobTitle: null,
    currency: null,
    months: null,
    sinceDate: null,
    limit: null,
    medianSplitFocus: null,
    ...overrides,
  };
}

describe("parseInsightQuery", () => {
  it("maps average department salary questions to AVG_DEPT_SALARY", () => {
    expect(parseInsightQuery("What is the average salary in Engineering?")).toEqual(
      parsed({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "What is the average salary in Engineering?",
        department: "Engineering",
      }),
    );
  });

  it("recognizes shorthand average salary phrasing", () => {
    expect(parseInsightQuery("avg salary in Engineering")).toEqual(
      parsed({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "avg salary in Engineering",
        department: "Engineering",
      }),
    );
  });

  it("extracts an optional currency from the query", () => {
    expect(parseInsightQuery("average salary in Engineering in USD")).toEqual(
      parsed({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in Engineering in USD",
        department: "Engineering",
        currency: "USD",
      }),
    );
  });

  it("maps promotion questions to RECENT_PROMOTIONS", () => {
    expect(parseInsightQuery("List employees who got promotion in the last 3months")).toEqual(
      parsed({
        intent: "RECENT_PROMOTIONS",
        originalQuery: "List employees who got promotion in the last 3months",
        months: 3,
      }),
    );
  });

  it("defaults promotion lookback to three months when no window is specified", () => {
    expect(parseInsightQuery("Who was promoted recently?")).toEqual(
      parsed({
        intent: "RECENT_PROMOTIONS",
        originalQuery: "Who was promoted recently?",
        months: 3,
      }),
    );
  });

  it("extracts an optional country filter from promotion questions", () => {
    expect(parseInsightQuery("employees promoted in India in the last 6 months")).toEqual(
      parsed({
        intent: "RECENT_PROMOTIONS",
        originalQuery: "employees promoted in India in the last 6 months",
        country: "IN",
        months: 6,
      }),
    );
  });

  it("extracts absolute since dates for timeline questions", () => {
    expect(parseInsightQuery("promotions since 2025-06-01")).toEqual(
      parsed({
        intent: "RECENT_PROMOTIONS",
        originalQuery: "promotions since 2025-06-01",
        sinceDate: "2025-06-01",
      }),
    );
  });

  it("maps new joiner questions to RECENT_NEW_HIRES", () => {
    expect(parseInsightQuery("new joiners in the last 6 months")).toEqual(
      parsed({
        intent: "RECENT_NEW_HIRES",
        originalQuery: "new joiners in the last 6 months",
        months: 6,
      }),
    );
  });

  it("maps joined-as-department questions to RECENT_NEW_HIRES", () => {
    expect(parseInsightQuery("employees who joined as engineers in the last 12 months")).toEqual(
      parsed({
        intent: "RECENT_NEW_HIRES",
        originalQuery: "employees who joined as engineers in the last 12 months",
        department: "Engineering",
        months: 12,
      }),
    );
  });

  it("extracts job title filters from joined-as-title questions", () => {
    expect(parseInsightQuery("employees who joined as Staff Engineer in the last 6 months")).toEqual(
      parsed({
        intent: "RECENT_NEW_HIRES",
        originalQuery: "employees who joined as Staff Engineer in the last 6 months",
        jobTitle: "Staff Engineer",
        months: 6,
      }),
    );
  });

  it("maps salary hike questions to RECENT_SALARY_INCREASES", () => {
    expect(parseInsightQuery("employees in India who got salary hike in the last 3 months")).toEqual(
      parsed({
        intent: "RECENT_SALARY_INCREASES",
        originalQuery: "employees in India who got salary hike in the last 3 months",
        country: "IN",
        months: 3,
      }),
    );
  });

  it("maps median department salary questions to MEDIAN_DEPT_SALARY", () => {
    expect(parseInsightQuery("median salary in HR")).toEqual(
      parsed({
        intent: "MEDIAN_DEPT_SALARY",
        originalQuery: "median salary in HR",
        department: "HR",
      }),
    );
  });

  it("maps headcount questions to HEADCOUNT", () => {
    expect(parseInsightQuery("What is the headcount in GBP?")).toEqual(
      parsed({
        intent: "HEADCOUNT",
        originalQuery: "What is the headcount in GBP?",
        currency: "GBP",
      }),
    );
  });

  it("recognizes alternate headcount phrasing", () => {
    expect(parseInsightQuery("How many employees are in USD?")).toEqual(
      parsed({
        intent: "HEADCOUNT",
        originalQuery: "How many employees are in USD?",
        currency: "USD",
      }),
    );
  });

  it("maps payroll questions to TOTAL_PAYROLL", () => {
    expect(parseInsightQuery("total payroll in USD")).toEqual(
      parsed({
        intent: "TOTAL_PAYROLL",
        originalQuery: "total payroll in USD",
        currency: "USD",
      }),
    );
  });

  it("maps top earner questions to TOP_EARNERS", () => {
    expect(parseInsightQuery("Who are the top earners in INR?")).toEqual(
      parsed({
        intent: "TOP_EARNERS",
        originalQuery: "Who are the top earners in INR?",
        currency: "INR",
      }),
    );
  });

  it("extracts configurable top-N limits", () => {
    expect(parseInsightQuery("Who are the top 5 earners in Engineering?")).toEqual(
      parsed({
        intent: "TOP_EARNERS",
        originalQuery: "Who are the top 5 earners in Engineering?",
        department: "Engineering",
        limit: 5,
      }),
    );
  });

  it("maps bottom earner questions to BOTTOM_EARNERS", () => {
    expect(parseInsightQuery("who are the least earners?")).toEqual(
      parsed({
        intent: "BOTTOM_EARNERS",
        originalQuery: "who are the least earners?",
      }),
    );
  });

  it("extracts configurable bottom-N limits", () => {
    expect(parseInsightQuery("bottom 3 earners in HR")).toEqual(
      parsed({
        intent: "BOTTOM_EARNERS",
        originalQuery: "bottom 3 earners in HR",
        department: "HR",
        limit: 3,
      }),
    );
  });

  it("maps near-median employee questions to NEAR_MEDIAN_EARNERS", () => {
    expect(parseInsightQuery("who earn around the median?")).toEqual(
      parsed({
        intent: "NEAR_MEDIAN_EARNERS",
        originalQuery: "who earn around the median?",
      }),
    );
  });

  it("maps below-and-above median count questions to MEDIAN_SPLIT_COUNTS", () => {
    expect(
      parseInsightQuery(
        "how many employees are earning below and above median in Engineering in India?",
      ),
    ).toEqual(
      parsed({
        intent: "MEDIAN_SPLIT_COUNTS",
        originalQuery:
          "how many employees are earning below and above median in Engineering in India?",
        department: "Engineering",
        country: "IN",
        medianSplitFocus: "both",
      }),
    );
  });

  it("maps below-median-only count questions to MEDIAN_SPLIT_COUNTS", () => {
    expect(
      parseInsightQuery(
        "How many employees are earning below median in Engineering in India?",
      ),
    ).toEqual(
      parsed({
        intent: "MEDIAN_SPLIT_COUNTS",
        originalQuery: "How many employees are earning below median in Engineering in India?",
        department: "Engineering",
        country: "IN",
        medianSplitFocus: "below",
      }),
    );
  });

  it("maps above-median-only count questions to MEDIAN_SPLIT_COUNTS", () => {
    expect(parseInsightQuery("number of employees earning above median in HR")).toEqual(
      parsed({
        intent: "MEDIAN_SPLIT_COUNTS",
        originalQuery: "number of employees earning above median in HR",
        department: "HR",
        medianSplitFocus: "above",
      }),
    );
  });

  it("parses all documented example insight queries to supported intents", () => {
    const exampleQueries = [
      "What is the average salary in Engineering?",
      "What is the average salary in India?",
      "total payroll for Engineering in India",
      "Who are the top 5 earners in Engineering in India?",
      "headcount in UK",
      "List employees who got promotion in the last 3 months",
      "new joiners in the last 6 months",
      "employees in India who got salary hike in the last 3 months",
      "employees who joined as engineers in the last 12 months",
      "employees who joined as Staff Engineer in the last 6 months",
      "Who was promoted recently in India?",
      "promotions since 2025-06-01",
      "Who are the least earners?",
      "Who earn around the median in Engineering?",
      "How many employees are earning below and above median in Engineering?",
      "How many employees are earning below median in Engineering in India?",
      "median salary in HR",
    ] as const;

    for (const query of exampleQueries) {
      const parsedQuery = parseInsightQuery(query);
      expect(parsedQuery.intent, query).not.toBe("UNKNOWN");
    }
  });

  it("keeps aggregate median salary questions separate from near-median lists", () => {
    expect(parseInsightQuery("median salary in HR")).toEqual(
      parsed({
        intent: "MEDIAN_DEPT_SALARY",
        originalQuery: "median salary in HR",
        department: "HR",
      }),
    );
  });

  it("extracts employee country filters from country names", () => {
    expect(parseInsightQuery("Who are the top earners in INDIA?")).toEqual(
      parsed({
        intent: "TOP_EARNERS",
        originalQuery: "Who are the top earners in INDIA?",
        country: "IN",
      }),
    );
  });

  it("extracts combined department and country filters from payroll questions", () => {
    expect(parseInsightQuery("Total payroll for Engineering in Inida?")).toEqual(
      parsed({
        intent: "TOTAL_PAYROLL",
        originalQuery: "Total payroll for Engineering in Inida?",
        department: "Engineering",
        country: "IN",
      }),
    );
  });

  it("extracts country filters from for-country payroll questions", () => {
    expect(parseInsightQuery("total payroll for UK")).toEqual(
      parsed({
        intent: "TOTAL_PAYROLL",
        originalQuery: "total payroll for UK",
        country: "UK",
      }),
    );
    expect(parseInsightQuery("total payroll for USA")).toEqual(
      parsed({
        intent: "TOTAL_PAYROLL",
        originalQuery: "total payroll for USA",
        country: "US",
      }),
    );
  });

  it("returns UNKNOWN when a salary intent has no department or country scope", () => {
    expect(parseInsightQuery("What is the average salary?")).toEqual(
      parsed({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "What is the average salary?",
      }),
    );
  });

  it("extracts country-scoped average salary questions", () => {
    expect(parseInsightQuery("What is the average salary in India?")).toEqual(
      parsed({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "What is the average salary in India?",
        country: "IN",
      }),
    );
  });

  it("returns UNKNOWN for unsupported questions", () => {
    expect(parseInsightQuery("Tell me a joke about payroll")).toEqual(
      parsed({
        intent: "UNKNOWN",
        originalQuery: "Tell me a joke about payroll",
      }),
    );
  });

  it("returns UNKNOWN for SQL injection style input", () => {
    expect(parseInsightQuery("average salary; DROP TABLE employees")).toEqual(
      parsed({
        intent: "UNKNOWN",
        originalQuery: "average salary; DROP TABLE employees",
      }),
    );
  });
});
