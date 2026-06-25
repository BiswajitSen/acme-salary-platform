import { describe, expect, it } from "vitest";

import { extractMedianSplitFocus } from "./median-split.js";

describe("extractMedianSplitFocus", () => {
  it("detects combined below-and-above median questions", () => {
    expect(
      extractMedianSplitFocus(
        "how many employees are earning below and above median in engineering?",
      ),
    ).toBe("both");
  });

  it("detects below-median-only questions", () => {
    expect(
      extractMedianSplitFocus(
        "how many employees are earning below median in engineering in india?",
      ),
    ).toBe("below");
  });

  it("detects above-median-only questions", () => {
    expect(
      extractMedianSplitFocus("count of employees paid above the median salary in hr"),
    ).toBe("above");
  });
});
