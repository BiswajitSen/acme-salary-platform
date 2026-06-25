import { describe, expect, it } from "vitest";

import {
  extractExplicitCompensationReason,
  isKnownCompensationReason,
} from "./compensation-reason.js";

describe("extractExplicitCompensationReason", () => {
  it("detects compensation reasons mentioned in natural language", () => {
    expect(extractExplicitCompensationReason("market adjustments in the last 3 months")).toBe(
      "Market Adjustment",
    );
    expect(extractExplicitCompensationReason("employees corrected recently")).toBe("Correction");
    expect(extractExplicitCompensationReason("recent promotions")).toBe("Promotion");
  });

  it("returns null when no explicit reason is mentioned", () => {
    expect(extractExplicitCompensationReason("headcount in engineering")).toBeNull();
  });
});

describe("isKnownCompensationReason", () => {
  it("accepts shared compensation reasons", () => {
    expect(isKnownCompensationReason("Promotion")).toBe(true);
  });

  it("rejects unknown reason strings", () => {
    expect(isKnownCompensationReason("Bonus")).toBe(false);
  });
});
