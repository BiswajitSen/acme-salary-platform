import { describe, expect, it } from "vitest";

import { formatAnalyticsPercent, formatPayrollPercent } from "./format-analytics-percent";

describe("formatAnalyticsPercent", () => {
  it("returns 0% for zero or negative values", () => {
    expect(formatAnalyticsPercent(0)).toBe("0%");
    expect(formatAnalyticsPercent(-1)).toBe("0%");
  });

  it("formats integer percentages without decimals", () => {
    expect(formatAnalyticsPercent(22)).toBe("22%");
  });

  it("formats fractional percentages to one decimal", () => {
    expect(formatAnalyticsPercent(22.9)).toBe("22.9%");
  });
});

describe("Enhance payroll % under analytics filters — compare to org compensation", () => {
  describe("formatPayrollPercent", () => {
    it("returns 0% for zero or negative values", () => {
      expect(formatPayrollPercent(0)).toBe("0%");
      expect(formatPayrollPercent(-2)).toBe("0%");
    });

    it("formats org-wide shares below 1% with two decimals", () => {
      expect(formatPayrollPercent(0.04)).toBe("0.04%");
      expect(formatPayrollPercent(0.9)).toBe("0.90%");
    });

    it("formats org-wide shares at or above 1% with one decimal", () => {
      expect(formatPayrollPercent(1)).toBe("1%");
      expect(formatPayrollPercent(22.9)).toBe("22.9%");
      expect(formatPayrollPercent(66.7)).toBe("66.7%");
    });
  });
});
