import { describe, expect, it } from "vitest";

import {
  applyDepartmentPayrollPercents,
  arePayrollTotalsAligned,
  computeMedian,
  computeTopTenPayrollPercent,
  countMedianSplit,
  pickHighestPaidLocation,
  pickHighestPayrollDepartment,
  sumDisplaySalaries,
} from "./analytics-math";
import type { AnalyticsDepartmentRow, AnalyticsLocationRow, CompensatedEmployeeRecord } from "./types";

const employees: CompensatedEmployeeRecord[] = [
  {
    id: "E001",
    fullName: "A",
    department: "Engineering",
    jobTitle: "Lead",
    country: "US",
    displaySalary: 200_000,
  },
  {
    id: "E002",
    fullName: "B",
    department: "Engineering",
    jobTitle: "Engineer",
    country: "IN",
    displaySalary: 100_000,
  },
  {
    id: "E003",
    fullName: "C",
    department: "HR",
    jobTitle: "Manager",
    country: "IN",
    displaySalary: 100_000,
  },
  {
    id: "E004",
    fullName: "D",
    department: "Sales",
    jobTitle: "Rep",
    country: "SG",
    displaySalary: 50_000,
  },
];

describe("computeMedian", () => {
  it("returns the middle value for odd-length arrays", () => {
    expect(computeMedian([10, 30, 20])).toBe(20);
  });

  it("averages the middle pair for even-length arrays", () => {
    expect(computeMedian([100_000, 200_000, 100_000, 200_000])).toBe(150_000);
  });
});

describe("pickHighestPaidLocation", () => {
  it("uses average salary rather than total payroll", () => {
    const locations: AnalyticsLocationRow[] = [
      {
        country: "IN",
        label: "India",
        payroll: 200_000,
        employeeCount: 2,
        averageSalary: 100_000,
      },
      {
        country: "SG",
        label: "Singapore",
        payroll: 50_000,
        employeeCount: 1,
        averageSalary: 50_000,
      },
    ];

    expect(pickHighestPaidLocation(locations)).toEqual({
      name: "India",
      averageSalary: 100_000,
    });
  });
});

describe("pickHighestPayrollDepartment", () => {
  it("selects the department with the largest payroll share", () => {
    const departments: AnalyticsDepartmentRow[] = [
      {
        department: "Engineering",
        employeeCount: 2,
        averageSalary: 150_000,
        medianSalary: 150_000,
        payrollPercent: 60,
      },
      {
        department: "HR",
        employeeCount: 1,
        averageSalary: 100_000,
        medianSalary: 100_000,
        payrollPercent: 20,
      },
    ];

    expect(pickHighestPayrollDepartment(departments)?.department).toBe("Engineering");
  });
});

describe("applyDepartmentPayrollPercents", () => {
  it("derives payroll percentages from employee salary sums", () => {
    const departments: AnalyticsDepartmentRow[] = [
      {
        department: "Engineering",
        employeeCount: 2,
        averageSalary: 150_000,
        medianSalary: 150_000,
        payrollPercent: 0,
      },
      {
        department: "HR",
        employeeCount: 1,
        averageSalary: 100_000,
        medianSalary: 100_000,
        payrollPercent: 0,
      },
      {
        department: "Sales",
        employeeCount: 1,
        averageSalary: 50_000,
        medianSalary: 50_000,
        payrollPercent: 0,
      },
    ];

    const enriched = applyDepartmentPayrollPercents(departments, employees, 450_000);

    expect(enriched).toEqual([
      expect.objectContaining({ department: "Engineering", payrollPercent: 66.7 }),
      expect.objectContaining({ department: "HR", payrollPercent: 22.2 }),
      expect.objectContaining({ department: "Sales", payrollPercent: 11.1 }),
    ]);
  });
});

describe("computeTopTenPayrollPercent", () => {
  it("uses aligned client top ten when employee payroll matches API total", () => {
    const largeWorkforce = Array.from({ length: 20 }, (_, index) => ({
      id: `E${index}`,
      fullName: `Employee ${index}`,
      department: "Engineering",
      jobTitle: "Engineer",
      country: "US",
      displaySalary: 10_000,
    }));
    largeWorkforce[0]!.displaySalary = 200_000;

    const totalPayroll = sumDisplaySalaries(largeWorkforce);
    const topTenPayroll =
      200_000 + Array.from({ length: 9 }, () => 10_000).reduce((sum, salary) => sum + salary, 0);
    const expected = Math.round((topTenPayroll / totalPayroll) * 1000) / 10;
    const percent = computeTopTenPayrollPercent(largeWorkforce, totalPayroll, null);

    expect(percent).toBe(expected);
  });

  it("falls back to API top earners when payroll totals diverge", () => {
    const percent = computeTopTenPayrollPercent(
      employees,
      10_000_000,
      [
        { employeeId: "E001", fullName: "A", department: "Engineering", baseSalary: 500_000 },
        { employeeId: "E002", fullName: "B", department: "Engineering", baseSalary: 400_000 },
      ],
    );

    expect(percent).toBe(9);
  });
});

describe("countMedianSplit", () => {
  it("tracks employees above, below, and at the median", () => {
    expect(countMedianSplit(employees, 100_000)).toEqual({
      aboveMedian: 1,
      belowMedian: 1,
      atMedian: 2,
    });
  });
});

describe("arePayrollTotalsAligned", () => {
  it("returns true when totals are within tolerance", () => {
    expect(arePayrollTotalsAligned(990, 1_000)).toBe(true);
    expect(arePayrollTotalsAligned(900, 1_000)).toBe(false);
  });
});
