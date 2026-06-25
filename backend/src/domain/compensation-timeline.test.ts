import { describe, expect, it } from "vitest";

import {
  buildCompensationTimeline,
  selectCurrentCompensation,
  sortCompensationHistoryNewestFirst,
  sortCompensationHistoryOldestFirst,
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

  it("uses createdAt and record id as tiebreakers for the same effective date", () => {
    expect(
      sortCompensationHistoryNewestFirst([
        { ...sampleRecords[0]!, id: 10, effectiveDate: "2025-06-01", createdAt: "2025-06-01T09:00:00.000Z" },
        { ...sampleRecords[1]!, id: 11, effectiveDate: "2025-06-01", createdAt: "2025-06-02T09:00:00.000Z" },
      ]).map((record) => record.id),
    ).toEqual([11, 10]);
  });
});

describe("sortCompensationHistoryOldestFirst", () => {
  it("orders records by effective date ascending", () => {
    expect(sortCompensationHistoryOldestFirst(sampleRecords).map((record) => record.id)).toEqual([
      1, 2,
    ]);
  });

  it("uses record id as the final tiebreaker", () => {
    expect(
      sortCompensationHistoryOldestFirst([
        { ...sampleRecords[0]!, id: 2, effectiveDate: "2025-06-01", createdAt: "2025-06-01T10:00:00.000Z" },
        { ...sampleRecords[1]!, id: 1, effectiveDate: "2025-06-01", createdAt: "2025-06-01T10:00:00.000Z" },
      ]).map((record) => record.id),
    ).toEqual([1, 2]);
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
  it("builds newest-first timeline entries with chronologically prior salaries", () => {
    expect(buildCompensationTimeline(sampleRecords)).toEqual([
      {
        id: 2,
        previousSalary: 90_000,
        previousCurrency: "USD",
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
        previousCurrency: null,
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

  it("uses chronological order for previous salary when multiple records share an effective date", () => {
    const entries = buildCompensationTimeline([
      {
        id: 1,
        employeeId: "E001",
        baseSalary: 4_221_607,
        currency: "INR",
        effectiveDate: "2024-01-01",
        reason: "New Hire",
        changedBy: "System",
        notes: null,
        createdAt: "2024-01-01T10:00:00.000Z",
      },
      {
        id: 2,
        employeeId: "E001",
        baseSalary: 4_696_558,
        currency: "INR",
        effectiveDate: "2025-01-01",
        reason: "Annual Increment",
        changedBy: "HR Admin",
        notes: null,
        createdAt: "2025-01-01T10:00:00.000Z",
      },
      {
        id: 3,
        employeeId: "E001",
        baseSalary: 9_743_224,
        currency: "INR",
        effectiveDate: "2025-01-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: null,
        createdAt: "2025-01-01T11:00:00.000Z",
      },
      {
        id: 4,
        employeeId: "E001",
        baseSalary: 1_000_000,
        currency: "INR",
        effectiveDate: "2026-06-30",
        reason: "Promotion",
        changedBy: "HR Biswajit Sen",
        notes: "Performance Increment",
        createdAt: "2026-06-30T10:00:00.000Z",
      },
    ]);

    expect(entries.map((entry) => entry.id)).toEqual([4, 3, 2, 1]);
    expect(entries[0]).toMatchObject({
      previousSalary: 9_743_224,
      previousCurrency: "INR",
      baseSalary: 1_000_000,
    });
    expect(entries[1]).toMatchObject({
      previousSalary: 4_696_558,
      previousCurrency: "INR",
      baseSalary: 9_743_224,
    });
    expect(entries[2]).toMatchObject({
      previousSalary: 4_221_607,
      previousCurrency: "INR",
      baseSalary: 4_696_558,
    });
    expect(entries[3]).toMatchObject({
      previousSalary: null,
      previousCurrency: null,
      baseSalary: 4_221_607,
    });
  });
});
