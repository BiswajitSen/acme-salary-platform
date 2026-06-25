import { describe, expect, it } from "vitest";

import {
  COMPENSATION_REASONS,
  recordCompensationChangeSchema,
  type EmployeeProfileResponse,
} from "./compensation";

describe("compensation contracts", () => {
  it("describes an employee profile with optional current compensation", () => {
    const profile: EmployeeProfileResponse = {
      id: "E001",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      country: "US",
      currentCompensation: null,
    };

    expect(profile.currentCompensation).toBeNull();
  });
});

describe("recordCompensationChangeSchema", () => {
  it("accepts a valid compensation change payload", () => {
    const parsed = recordCompensationChangeSchema.parse({
      baseSalary: 140_000,
      currency: "usd",
      effectiveDate: "2026-01-01",
      reason: "Promotion",
      changedBy: "HR Admin",
      notes: "Role expansion",
    });

    expect(parsed).toEqual({
      baseSalary: 140_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "Promotion",
      changedBy: "HR Admin",
      notes: "Role expansion",
    });
  });

  it("rejects non-positive base salary", () => {
    const result = recordCompensationChangeSchema.safeParse({
      baseSalary: -1,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "Correction",
      changedBy: "HR Admin",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid ISO currency codes", () => {
    const result = recordCompensationChangeSchema.safeParse({
      baseSalary: 100_000,
      currency: "US",
      effectiveDate: "2026-01-01",
      reason: "Correction",
      changedBy: "HR Admin",
    });

    expect(result.success).toBe(false);
  });

  it("rejects reasons outside the shared enum", () => {
    const result = recordCompensationChangeSchema.safeParse({
      baseSalary: 100_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "Bonus",
      changedBy: "HR Admin",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing effective date", () => {
    const result = recordCompensationChangeSchema.safeParse({
      baseSalary: 100_000,
      currency: "USD",
      effectiveDate: "",
      reason: "Promotion",
      changedBy: "HR Admin",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Effective date is required");
    }
  });

  it("rejects an invalid effective date format", () => {
    const result = recordCompensationChangeSchema.safeParse({
      baseSalary: 100_000,
      currency: "USD",
      effectiveDate: "01-01-2026",
      reason: "Promotion",
      changedBy: "HR Admin",
    });

    expect(result.success).toBe(false);
  });

  it("exports the PRD compensation reason enum", () => {
    expect(COMPENSATION_REASONS).toHaveLength(5);
    expect(COMPENSATION_REASONS).toContain("Annual Increment");
  });
});
