import { describe, expect, it } from "vitest";

import {
  FIXTURE_COUNTRIES,
  FIXTURE_CURRENCIES,
  FIXTURE_DEPARTMENTS,
  createCompensationSpreadsheetRows,
  createEmployeeFixtureRow,
  createEmployeeSpreadsheetRows,
  deriveFixtureCompensationCurrency,
  deriveFixtureCompensationSalary,
  formatFixtureEmployeeId,
  indexOfFixtureDepartment,
  parseFixtureEmployeeNumber,
} from "./index.js";

function groupFixtureDepartmentsByCurrency(
  totalEmployees: number,
): Map<string, Set<string>> {
  const departmentsByCurrency = new Map<string, Set<string>>();

  for (const employee of createEmployeeSpreadsheetRows(totalEmployees)) {
    const employeeNumber = parseFixtureEmployeeNumber(employee.employee_id);
    const currency = deriveFixtureCompensationCurrency(employeeNumber, employee.department);
    const departments = departmentsByCurrency.get(currency) ?? new Set<string>();

    departments.add(employee.department);
    departmentsByCurrency.set(currency, departments);
  }

  return departmentsByCurrency;
}

describe("formatFixtureEmployeeId", () => {
  it("formats employee ids with zero padding", () => {
    expect(formatFixtureEmployeeId(1)).toBe("E00001");
    expect(parseFixtureEmployeeNumber("E00001")).toBe(1);
  });
});

describe("createEmployeeFixtureRow", () => {
  it("cycles departments independently from countries", () => {
    expect(createEmployeeFixtureRow(1)).toEqual({
      employee_id: "E00001",
      full_name: "Employee 1",
      department: "Engineering",
      job_title: "Analyst",
      country: "US",
    });
    expect(createEmployeeFixtureRow(6)).toEqual({
      employee_id: "E00006",
      full_name: "Employee 6",
      department: "Engineering",
      job_title: "Analyst",
      country: "UK",
    });
  });

  it("covers every country across the first block of employees", () => {
    const countries = new Set(
      createEmployeeSpreadsheetRows(FIXTURE_COUNTRIES.length * FIXTURE_DEPARTMENTS.length).map(
        (employee) => employee.country,
      ),
    );

    expect([...countries].sort()).toEqual([...FIXTURE_COUNTRIES].sort());
  });
});

describe("createCompensationSpreadsheetRows", () => {
  it("falls back to the first department index for unknown departments", () => {
    expect(indexOfFixtureDepartment("Unknown")).toBe(0);
    expect(deriveFixtureCompensationSalary(10, "Unknown")).toBe(
      deriveFixtureCompensationSalary(10, FIXTURE_DEPARTMENTS[0]!),
    );
    expect(deriveFixtureCompensationCurrency(10, "Unknown")).toBe(
      deriveFixtureCompensationCurrency(10, FIXTURE_DEPARTMENTS[0]!),
    );
  });

  it("assigns multiple departments to each currency", () => {
    const departmentsByCurrency = groupFixtureDepartmentsByCurrency(10_000);

    for (const currency of FIXTURE_CURRENCIES) {
      expect(departmentsByCurrency.get(currency)?.size).toBe(FIXTURE_DEPARTMENTS.length);
    }
  });

  it("varies currency within the same department", () => {
    const engineeringCurrencies = new Set(
      createEmployeeSpreadsheetRows(100)
        .filter((employee) => employee.department === "Engineering")
        .map((employee) =>
          deriveFixtureCompensationCurrency(
            parseFixtureEmployeeNumber(employee.employee_id),
            employee.department,
          ),
        ),
    );

    expect(engineeringCurrencies.size).toBeGreaterThan(1);
  });

  it("builds one compensation row per employee", () => {
    const rows = createCompensationSpreadsheetRows(25);

    expect(rows).toHaveLength(25);
    expect(rows[0]).toMatchObject({
      employee_id: "E00001",
      effective_date: "2025-01-01",
      changed_by: "HR Admin",
    });
  });
});
