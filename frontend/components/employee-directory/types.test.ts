import { describe, expect, it } from "vitest";

import {
  appliedFromDraftSelection,
  draftFromAppliedFilter,
  isColumnFilterActive,
  serializeFilterValues,
} from "./types";

describe("directory filter helpers", () => {
  const options = ["US", "UK", "SG"];

  it("serializes selected values for the API", () => {
    expect(serializeFilterValues(["US", "UK"])).toBe("US,UK");
    expect(serializeFilterValues([])).toBeUndefined();
  });

  it("detects active column filters", () => {
    expect(isColumnFilterActive([], options)).toBe(false);
    expect(isColumnFilterActive(options, options)).toBe(false);
    expect(isColumnFilterActive(["US"], options)).toBe(true);
  });

  it("maps applied values to draft selections", () => {
    expect(draftFromAppliedFilter([], options)).toEqual(options);
    expect(draftFromAppliedFilter(["US"], options)).toEqual(["US"]);
  });

  it("maps draft selections back to applied values", () => {
    expect(appliedFromDraftSelection(options, options)).toEqual([]);
    expect(appliedFromDraftSelection(["US"], options)).toEqual(["US"]);
  });
});
