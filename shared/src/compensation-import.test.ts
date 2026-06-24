import { describe, expect, it } from "vitest";

import type { CompensationImportPreviewResponse } from "./compensation-import";

describe("compensation import contracts", () => {
  it("accepts a valid preview response shape", () => {
    const preview: CompensationImportPreviewResponse = {
      recordCount: 1,
      errors: [],
      isValid: true,
    };

    expect(preview.recordCount).toBe(1);
  });
});
