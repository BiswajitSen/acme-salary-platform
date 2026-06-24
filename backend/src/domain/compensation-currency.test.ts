import { describe, expect, it } from "vitest";

import {
  calculateTotalPayrollForSingleCurrency,
  groupCompensationEntriesByCurrency,
} from "./compensation-currency.js";

describe("calculateTotalPayrollForSingleCurrency", () => {
  it("returns zero for an empty list", () => {
    expect(calculateTotalPayrollForSingleCurrency([])).toBe(0);
  });

  it("sums salaries when every entry uses the same currency", () => {
    const total = calculateTotalPayrollForSingleCurrency([
      { baseSalary: 100_000, currency: "USD" },
      { baseSalary: 50_000, currency: "USD" },
    ]);

    expect(total).toBe(150_000);
  });

  it("rejects cross-currency aggregation in a single total", () => {
    expect(() =>
      calculateTotalPayrollForSingleCurrency([
        { baseSalary: 100_000, currency: "USD" },
        { baseSalary: 80_000, currency: "EUR" },
      ]),
    ).toThrow("Cannot sum salaries across multiple currencies");
  });
});

describe("groupCompensationEntriesByCurrency", () => {
  it("groups entries by currency without blending totals", () => {
    const grouped = groupCompensationEntriesByCurrency([
      { baseSalary: 100_000, currency: "USD" },
      { baseSalary: 80_000, currency: "EUR" },
      { baseSalary: 50_000, currency: "USD" },
    ]);

    expect(grouped.get("USD")).toEqual([
      { baseSalary: 100_000, currency: "USD" },
      { baseSalary: 50_000, currency: "USD" },
    ]);
    expect(grouped.get("EUR")).toEqual([{ baseSalary: 80_000, currency: "EUR" }]);
  });
});
