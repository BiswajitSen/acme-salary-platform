import { describe, expect, it } from "vitest";

import type { EmployeeImportPreviewResponse } from "./employee-import.js";

describe("employee import contracts", () => {
  it("describes a valid preview response shape", () => {
    const preview: EmployeeImportPreviewResponse = {
      employees: [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
      ],
      errors: [],
      isValid: true,
    };

    expect(preview.employees).toHaveLength(1);
    expect(preview.isValid).toBe(true);
  });
});
