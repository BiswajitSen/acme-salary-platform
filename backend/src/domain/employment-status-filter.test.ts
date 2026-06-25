import { describe, expect, it } from "vitest";

import { buildEmploymentStatusFilterClause } from "./employment-status-filter.js";

describe("buildEmploymentStatusFilterClause", () => {
  it("returns a clause for each filter mode", () => {
    expect(buildEmploymentStatusFilterClause(undefined)).toBeDefined();
    expect(buildEmploymentStatusFilterClause([])).toBeDefined();
    expect(buildEmploymentStatusFilterClause(["ACTIVE"])).toBeDefined();
    expect(buildEmploymentStatusFilterClause(["NO_COMPENSATION"])).toBeDefined();
    expect(buildEmploymentStatusFilterClause(["ACTIVE", "NO_COMPENSATION"])).toBeDefined();
    expect(buildEmploymentStatusFilterClause(["UNKNOWN" as "ACTIVE"])).toBeDefined();
  });
});
