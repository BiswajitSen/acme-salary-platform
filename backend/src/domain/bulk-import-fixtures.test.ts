import { describe, expect, it } from "vitest";

import {
  FIXTURE_COUNTRIES,
  FIXTURE_CURRENCIES,
  FIXTURE_DEPARTMENTS,
  buildCompensationSpreadsheetRows,
  buildEmployeeFixtureRow,
  buildEmployeeSpreadsheetRows,
  resolveFixtureCurrency,
  summarizeFixtureCurrencyDepartments,
} from "./bulk-import-fixtures.js";

describe("buildEmployeeFixtureRow", () => {
  it("cycles departments independently from countries", () => {
    expect(buildEmployeeFixtureRow(1)).toEqual({
      employee_id: "E00001",
      full_name: "Employee 1",
      department: "Engineering",
      job_title: "Analyst",
      country: "US",
    });
    expect(buildEmployeeFixtureRow(6)).toEqual({
      employee_id: "E00006",
      full_name: "Employee 6",
      department: "Engineering",
      job_title: "Analyst",
      country: "UK",
    });
  });

  it("covers every country across the first block of employees", () => {
    const countries = new Set(
      buildEmployeeSpreadsheetRows(FIXTURE_COUNTRIES.length * FIXTURE_DEPARTMENTS.length).map(
        (employee) => employee.country,
      ),
    );

    expect([...countries].sort()).toEqual([...FIXTURE_COUNTRIES].sort());
  });
});

describe("buildCompensationSpreadsheetRows", () => {
  it("assigns multiple departments to each currency", () => {
    const departmentsByCurrency = summarizeFixtureCurrencyDepartments(10_000);

    for (const currency of FIXTURE_CURRENCIES) {
      expect(departmentsByCurrency.get(currency)?.size).toBe(FIXTURE_DEPARTMENTS.length);
    }
  });

  it("varies currency within the same department", () => {
    const engineeringCurrencies = new Set(
      buildEmployeeSpreadsheetRows(100)
        .filter((employee) => employee.department === "Engineering")
        .map((employee) =>
          resolveFixtureCurrency(Number(employee.employee_id.slice(1)), employee.department),
        ),
    );

    expect(engineeringCurrencies.size).toBeGreaterThan(1);
  });

  it("builds one compensation row per employee", () => {
    const rows = buildCompensationSpreadsheetRows(25);

    expect(rows).toHaveLength(25);
    expect(rows[0]).toMatchObject({
      employee_id: "E00001",
      effective_date: "2025-01-01",
      changed_by: "HR Admin",
    });
  });
});
