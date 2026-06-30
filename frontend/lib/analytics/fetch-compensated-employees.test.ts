import { TEST_EXCHANGE_RATES_TO_USD, type EmployeeSummary } from "@acme/shared";
import { describe, expect, it, vi } from "vitest";

import { getAnalyticsCompensatedEmployees } from "@/lib/api/analytics";

import { fetchCompensatedEmployees, toCompensatedEmployeeRecords } from "./fetch-compensated-employees";

vi.mock("@/lib/api/analytics", () => ({
  getAnalyticsCompensatedEmployees: vi.fn(),
}));

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
    expect(toCompensatedEmployeeRecords(employees, "GBP", TEST_EXCHANGE_RATES_TO_USD)).toEqual([
      expect.objectContaining({
        id: "E001",
        displaySalary: 105_600,
      }),
      expect.objectContaining({
        id: "E002",
        displaySalary: 85_000,
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

describe("fetchCompensatedEmployees", () => {
  it("loads compensated employees in a single analytics request", async () => {
    vi.mocked(getAnalyticsCompensatedEmployees).mockResolvedValue({
      currency: "USD",
      exchangeRatesAsOf: "2026-01-01",
      employees: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
          displaySalary: 132_000,
        },
      ],
    });

    await expect(fetchCompensatedEmployees("USD")).resolves.toEqual([
      {
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
        displaySalary: 132_000,
      },
    ]);

    expect(getAnalyticsCompensatedEmployees).toHaveBeenCalledWith("USD");
  });
});
