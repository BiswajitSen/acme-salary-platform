import { describe, expect, it } from "vitest";

import type { EmployeeProfileResponse } from "./compensation.js";

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
