import { describe, expect, it } from "vitest";

import { extractInsightCountry } from "./country.js";

describe("extractInsightCountry", () => {
  it("maps India to the IN country code", () => {
    expect(extractInsightCountry("who are the top earners in india?")).toBe("IN");
  });

  it("does not treat the preposition in as the IN country code", () => {
    expect(extractInsightCountry("top earners in engineering")).toBeNull();
  });

  it("maps the Inida typo to the IN country code", () => {
    expect(extractInsightCountry("total payroll for engineering in inida")).toBe("IN");
  });

  it("maps country names, for-country phrasing, and explicit country codes", () => {
    expect(extractInsightCountry("top earners in america")).toBe("US");
    expect(extractInsightCountry("total payroll for uk")).toBe("UK");
    expect(extractInsightCountry("total payroll for usa")).toBe("US");
    expect(extractInsightCountry("top earners in britain")).toBe("UK");
    expect(extractInsightCountry("top earners in singapore")).toBe("SG");
    expect(extractInsightCountry("top earners in germany")).toBe("DE");
    expect(extractInsightCountry("top earners in US")).toBe("US");
    expect(extractInsightCountry("top earners in IN")).toBe("IN");
  });

  it("returns null when no country is mentioned", () => {
    expect(extractInsightCountry("top earners in inr")).toBeNull();
  });

  it("normalizes USA country tokens in for-country phrasing", () => {
    expect(extractInsightCountry("total payroll for USA")).toBe("US");
  });

  it("maps for-country and iso country code phrasing", () => {
    expect(extractInsightCountry("headcount for uk")).toBe("UK");
    expect(extractInsightCountry("payroll for SG")).toBe("SG");
    expect(extractInsightCountry("payroll cost DE")).toBe("DE");
    expect(extractInsightCountry("top earners in US")).toBe("US");
  });
});
