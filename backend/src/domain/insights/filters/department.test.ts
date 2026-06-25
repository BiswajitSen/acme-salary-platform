import { describe, expect, it } from "vitest";

import { extractInsightDepartment, resolveDepartmentFromAlias } from "./department.js";

describe("extractInsightDepartment", () => {
  it("matches canonical department names", () => {
    expect(extractInsightDepartment("average salary in engineering")).toBe("Engineering");
    expect(extractInsightDepartment("headcount in hr")).toBe("HR");
  });

  it("maps common aliases to canonical departments", () => {
    expect(extractInsightDepartment("total payroll for human resources")).toBe("HR");
    expect(extractInsightDepartment("top earners in ops")).toBe("Operations");
    expect(extractInsightDepartment("median salary for engineers")).toBe("Engineering");
  });

  it("returns null when no department is mentioned", () => {
    expect(extractInsightDepartment("who are the top earners?")).toBeNull();
  });
});

describe("resolveDepartmentFromAlias", () => {
  it("resolves aliases case-insensitively", () => {
    expect(resolveDepartmentFromAlias("HR")).toBe("HR");
    expect(resolveDepartmentFromAlias("human resources")).toBe("HR");
    expect(resolveDepartmentFromAlias("Engineering")).toBe("Engineering");
  });

  it("returns null for unknown phrases", () => {
    expect(resolveDepartmentFromAlias("rogue dept")).toBeNull();
  });
});
