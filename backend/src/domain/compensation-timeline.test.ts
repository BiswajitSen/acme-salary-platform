import { describe, expect, it } from "vitest";

import {
  buildCompensationTimeline,
  selectCurrentCompensation,
  sortCompensationHistoryNewestFirst,
} from "./compensation-timeline.js";
import type { CompensationHistoryRecord } from "./compensation.types.js";

const sampleRecords: CompensationHistoryRecord[] = [
  {
    id: 1,
    employeeId: "E001",
    baseSalary: 90_000,
    currency: "USD",
    effectiveDate: "2024-01-01",
    reason: "New Hire",
    changedBy: "HR Admin",
    notes: null,
    createdAt: "2024-01-02T10:00:00.000Z",
  },
  {
    id: 2,
    employeeId: "E001",
    baseSalary: 98_000,
    currency: "USD",
    effectiveDate: "2025-01-01",
    reason: "Annual Increment",
    changedBy: "HR Admin",
    notes: "Merit increase",
    createdAt: "2025-01-02T10:00:00.000Z",
  },
];

describe("sortCompensationHistoryNewestFirst", () => {
  it("orders records by effective date descending", () => {
    expect(sortCompensationHistoryNewestFirst(sampleRecords).map((record) => record.id)).toEqual([
      2, 1,
    ]);
  });

  it("uses record id as a tiebreaker for the same effective date", () => {
    expect(
      sortCompensationHistoryNewestFirst([
        { ...sampleRecords[0]!, id: 10, effectiveDate: "2025-06-01" },
        { ...sampleRecords[1]!, id: 11, effectiveDate: "2025-06-01" },
      ]).map((record) => record.id),
    ).toEqual([11, 10]);
  });
});

describe("selectCurrentCompensation", () => {
  it("returns the latest compensation record", () => {
    expect(selectCurrentCompensation(sampleRecords)).toEqual({
      baseSalary: 98_000,
      currency: "USD",
      effectiveDate: "2025-01-01",
      reason: "Annual Increment",
      changedBy: "HR Admin",
      lastUpdated: "2025-01-02T10:00:00.000Z",
    });
  });

  it("returns null when an employee has no compensation history", () => {
    expect(selectCurrentCompensation([])).toBeNull();
  });
});

describe("buildCompensationTimeline", () => {
  it("builds newest-first timeline entries with previous salaries", () => {
    expect(buildCompensationTimeline(sampleRecords)).toEqual([
      {
        id: 2,
        previousSalary: 90_000,
        baseSalary: 98_000,
        currency: "USD",
        effectiveDate: "2025-01-01",
        reason: "Annual Increment",
        changedBy: "HR Admin",
        notes: "Merit increase",
        createdAt: "2025-01-02T10:00:00.000Z",
      },
      {
        id: 1,
        previousSalary: null,
        baseSalary: 90_000,
        currency: "USD",
        effectiveDate: "2024-01-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: null,
        createdAt: "2024-01-02T10:00:00.000Z",
      },
    ]);
  });
});
