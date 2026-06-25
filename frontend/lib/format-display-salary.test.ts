import { describe, expect, it } from "vitest";

import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

import { formatDisplaySalary } from "./format-display-salary";

describe("formatDisplaySalary", () => {
  it("formats amounts in the native currency when display currency matches", () => {
    expect(formatDisplaySalary(132_000, "USD", "USD", TEST_EXCHANGE_RATES_TO_USD)).toBe(
      "$132,000",
    );
  });

  it("converts amounts into the selected display currency", () => {
    expect(formatDisplaySalary(86_300, "SGD", "INR", TEST_EXCHANGE_RATES_TO_USD)).toBe(
      "₹5,393,750",
    );
  });

  it("falls back to the native currency when conversion is unsupported", () => {
    expect(formatDisplaySalary(100_000, "JPY", "USD", TEST_EXCHANGE_RATES_TO_USD)).toBe(
      "¥100,000",
    );
  });
});
