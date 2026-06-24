import { describe, expect, it } from "vitest";

import {
  analyticsSummaryQuerySchema,
  COMPENSATION_REASONS,
  DEFAULT_EMPLOYEE_LIMIT,
  DEFAULT_EMPLOYEE_PAGE,
  insightQueryRequestSchema,
  listEmployeesQuerySchema,
  MAX_EMPLOYEE_LIMIT,
} from "./index";

describe("shared exports", () => {
  it("re-exports employee list contract symbols", () => {
    expect(DEFAULT_EMPLOYEE_PAGE).toBe(1);
    expect(DEFAULT_EMPLOYEE_LIMIT).toBe(50);
    expect(MAX_EMPLOYEE_LIMIT).toBe(100);
    expect(listEmployeesQuerySchema.parse({})).toEqual({
      page: DEFAULT_EMPLOYEE_PAGE,
      limit: DEFAULT_EMPLOYEE_LIMIT,
    });
  });

  it("defines compensation reason enums from the PRD", () => {
    expect(COMPENSATION_REASONS).toContain("Annual Increment");
    expect(COMPENSATION_REASONS).toHaveLength(5);
  });

  it("re-exports analytics summary contract symbols", () => {
    expect(analyticsSummaryQuerySchema.parse({ currency: "EUR" })).toEqual({
      currency: "EUR",
    });
  });

  it("re-exports ai insight query contract symbols", () => {
    expect(insightQueryRequestSchema.parse({ query: "average salary in Engineering" })).toEqual({
      query: "average salary in Engineering",
    });
  });
});
