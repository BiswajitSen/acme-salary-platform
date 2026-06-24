import { describe, expect, it } from "vitest";

import { formatSalary } from "./format-salary";

describe("formatSalary", () => {
  it("formats amounts using en-US currency notation", () => {
    expect(formatSalary(132_000, "USD")).toBe("$132,000");
  });
});
