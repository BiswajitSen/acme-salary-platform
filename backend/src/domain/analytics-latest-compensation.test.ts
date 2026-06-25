import { describe, expect, it } from "vitest";

import {
  latestCompensationCurrencies,
  latestCompensationRows,
} from "./analytics-latest-compensation.js";

describe("analytics latest compensation SQL fragments", () => {
  it("exports latest-compensation query fragments", () => {
    expect(latestCompensationRows).toBeDefined();
    expect(latestCompensationCurrencies).toBeDefined();
  });
});
