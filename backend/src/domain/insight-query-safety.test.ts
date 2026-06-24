import { describe, expect, it } from "vitest";

import {
  isAllowedInsightDepartment,
  looksLikeSqlInjection,
  parseSafeInsightCurrency,
} from "./insight-query-safety.js";

describe("looksLikeSqlInjection", () => {
  it("detects SQL keywords and statement terminators", () => {
    expect(looksLikeSqlInjection("average salary; drop table employees")).toBe(true);
    expect(looksLikeSqlInjection("select * from employees")).toBe(true);
    expect(looksLikeSqlInjection("headcount -- comment")).toBe(true);
  });

  it("allows normal analytics questions", () => {
    expect(looksLikeSqlInjection("average salary in engineering")).toBe(false);
  });
});

describe("isAllowedInsightDepartment", () => {
  it("accepts departments from the shared allowlist", () => {
    expect(isAllowedInsightDepartment("Engineering", ["Engineering", "HR"])).toBe(true);
  });

  it("rejects departments outside the allowlist", () => {
    expect(isAllowedInsightDepartment("Engineering; DROP TABLE", ["Engineering"])).toBe(
      false,
    );
  });
});

describe("parseSafeInsightCurrency", () => {
  it("normalizes valid ISO currency codes", () => {
    expect(parseSafeInsightCurrency("usd")).toBe("USD");
  });

  it("rejects invalid currency codes", () => {
    expect(parseSafeInsightCurrency("US")).toBeNull();
    expect(parseSafeInsightCurrency("USD'; DROP TABLE--")).toBeNull();
  });
});
