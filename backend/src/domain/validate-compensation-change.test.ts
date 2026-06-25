import { describe, expect, it } from "vitest";

import type { CompensationHistoryRecord } from "./compensation.types.js";
import {
  findPredecessorForNewRecord,
  validateNewHireReason,
  validateSalaryIncreaseReason,
} from "./validate-compensation-change.js";

const history: CompensationHistoryRecord[] = [
  {
    id: 1,
    employeeId: "E001",
    baseSalary: 100_000,
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
    baseSalary: 110_000,
    currency: "USD",
    effectiveDate: "2025-01-01",
    reason: "Annual Increment",
    changedBy: "HR Admin",
    notes: null,
    createdAt: "2025-01-02T10:00:00.000Z",
  },
];

describe("findPredecessorForNewRecord", () => {
  it("returns the latest record on or before the effective date", () => {
    expect(findPredecessorForNewRecord(history, "2024-06-01")).toMatchObject({
      baseSalary: 100_000,
    });
    expect(findPredecessorForNewRecord(history, "2025-01-01")).toMatchObject({
      baseSalary: 110_000,
    });
  });

  it("returns null when the effective date is before the first record", () => {
    expect(findPredecessorForNewRecord(history, "2023-01-01")).toBeNull();
  });

  it("uses chronological tiebreakers when multiple records share an effective date", () => {
    const sameDayHistory: CompensationHistoryRecord[] = [
      {
        id: 1,
        employeeId: "E001",
        baseSalary: 100_000,
        currency: "USD",
        effectiveDate: "2025-01-01",
        reason: "New Hire",
        changedBy: "HR Admin",
        notes: null,
        createdAt: "2025-01-01T09:00:00.000Z",
      },
      {
        id: 2,
        employeeId: "E001",
        baseSalary: 105_000,
        currency: "USD",
        effectiveDate: "2025-01-01",
        reason: "Correction",
        changedBy: "HR Admin",
        notes: null,
        createdAt: "2025-01-01T10:00:00.000Z",
      },
    ];

    expect(findPredecessorForNewRecord(sameDayHistory, "2025-01-01")).toMatchObject({
      id: 2,
      baseSalary: 105_000,
    });
  });
});

describe("validateNewHireReason", () => {
  it("allows New Hire when compensation history is empty", () => {
    expect(validateNewHireReason([], "New Hire")).toBeNull();
  });

  it("rejects New Hire when compensation history already exists", () => {
    expect(validateNewHireReason(history, "New Hire")).toBe(
      "New Hire can only be used for an employee's first compensation record",
    );
  });

  it("skips validation for other compensation reasons", () => {
    expect(validateNewHireReason(history, "Promotion")).toBeNull();
  });
});

describe("validateSalaryIncreaseReason", () => {
  it.each(["Annual Increment", "Promotion"] as const)(
    "allows a %s that is greater than the previous salary",
    (reason) => {
      expect(
        validateSalaryIncreaseReason(history, {
          baseSalary: 120_000,
          currency: "USD",
          effectiveDate: "2026-01-01",
          reason,
        }),
      ).toBeNull();
    },
  );

  it.each(["Annual Increment", "Promotion"] as const)(
    "allows a %s equal to the previous salary",
    (reason) => {
      expect(
        validateSalaryIncreaseReason(history, {
          baseSalary: 110_000,
          currency: "USD",
          effectiveDate: "2026-01-01",
          reason,
        }),
      ).toBeNull();
    },
  );

  it("validates against the chronological predecessor when backdating between existing records", () => {
    expect(
      validateSalaryIncreaseReason(history, {
        baseSalary: 115_000,
        currency: "USD",
        effectiveDate: "2024-06-01",
        reason: "Promotion",
      }),
    ).toBeNull();
  });

  it.each(["Annual Increment", "Promotion"] as const)(
    "rejects a %s below the previous salary",
    (reason) => {
      expect(
        validateSalaryIncreaseReason(history, {
          baseSalary: 105_000,
          currency: "USD",
          effectiveDate: "2026-01-01",
          reason,
        }),
      ).toBe(
        `${reason} salary cannot be less than the previous salary of 110000 USD`,
      );
    },
  );

  it("rejects an increase reason when there is no prior compensation record", () => {
    expect(
      validateSalaryIncreaseReason([], {
        baseSalary: 100_000,
        currency: "USD",
        effectiveDate: "2026-01-01",
        reason: "Promotion",
      }),
    ).toBe("Promotion requires an existing compensation record");
  });

  it("rejects an increase reason in a different currency than the previous salary", () => {
    expect(
      validateSalaryIncreaseReason(history, {
        baseSalary: 120_000,
        currency: "EUR",
        effectiveDate: "2026-01-01",
        reason: "Annual Increment",
      }),
    ).toBe("Annual Increment must use USD to match the previous salary");
  });

  it("skips validation for other compensation reasons", () => {
    expect(
      validateSalaryIncreaseReason(history, {
        baseSalary: 50_000,
        currency: "USD",
        effectiveDate: "2026-01-01",
        reason: "Correction",
      }),
    ).toBeNull();
  });
});
