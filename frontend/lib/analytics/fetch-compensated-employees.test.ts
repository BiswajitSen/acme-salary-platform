import { TEST_EXCHANGE_RATES_TO_USD, type EmployeeSummary } from "@acme/shared";
import { describe, expect, it } from "vitest";

import { toCompensatedEmployeeRecords } from "./fetch-compensated-employees";

const employees: EmployeeSummary[] = [
  {
    id: "E001",
    fullName: "Jane Doe",
    department: "Engineering",
    jobTitle: "Senior Engineer",
    country: "US",
    baseSalary: 132_000,
    currency: "USD",
    employmentStatus: "ACTIVE",
  },
  {
    id: "E002",
    fullName: "Bob Smith",
    department: "HR",
    jobTitle: "HR Manager",
    country: "UK",
    baseSalary: 85_000,
    currency: "GBP",
    employmentStatus: "ACTIVE",
  },
];

describe("toCompensatedEmployeeRecords", () => {
  it("converts each employee salary into the selected display currency", () => {
    expect(toCompensatedEmployeeRecords(employees, "USD", TEST_EXCHANGE_RATES_TO_USD)).toEqual([
      expect.objectContaining({
        id: "E001",
        displaySalary: 132_000,
      }),
      expect.objectContaining({
        id: "E002",
        displaySalary: 106_250,
      }),
    ]);
  });

  it("preserves employee metadata used by analytics filters", () => {
    const [record] = toCompensatedEmployeeRecords(employees, "USD", TEST_EXCHANGE_RATES_TO_USD);

    expect(record).toMatchObject({
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      country: "US",
    });
  });
});
