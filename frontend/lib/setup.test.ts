import { describe, expect, it } from "vitest";

import { COMPENSATION_REASONS } from "@acme/shared";

describe("shared contract", () => {
  it("defines compensation reason enums from the PRD", () => {
    expect(COMPENSATION_REASONS).toContain("Annual Increment");
    expect(COMPENSATION_REASONS).toHaveLength(5);
  });
});
