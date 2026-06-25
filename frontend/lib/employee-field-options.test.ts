import { describe, expect, it } from "vitest";

import { mergeEmployeeFieldOptions } from "./employee-field-options";

describe("mergeEmployeeFieldOptions", () => {
  it("merges canonical values with directory values and sorts them", () => {
    expect(
      mergeEmployeeFieldOptions(["Engineering", "HR"], ["Finance", "Engineering"]),
    ).toEqual(["Engineering", "Finance", "HR"]);
  });

  it("includes the current value when it is not already present", () => {
    expect(mergeEmployeeFieldOptions(["Engineering"], [], "Custom Team")).toEqual([
      "Custom Team",
      "Engineering",
    ]);
  });
});
