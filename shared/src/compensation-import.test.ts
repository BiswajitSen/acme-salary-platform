import { describe, expect, it } from "vitest";

import type { CompensationImportPreviewResponse } from "./compensation-import";

describe("compensation import contracts", () => {
  it("accepts a valid preview response shape", () => {
    const preview: CompensationImportPreviewResponse = {
      records: [
        {
          employeeId: "E001",
          baseSalary: 120_000,
          currency: "USD",
          effectiveDate: "2024-01-01",
          reason: "New Hire",
          changedBy: "HR Admin",
          notes: null,
        },
      ],
      errors: [],
      isValid: true,
    };

    expect(preview.records).toHaveLength(1);
  });
});
