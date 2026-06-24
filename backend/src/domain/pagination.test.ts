import {
  DEFAULT_EMPLOYEE_LIMIT,
  DEFAULT_EMPLOYEE_PAGE,
  MAX_EMPLOYEE_LIMIT,
} from "@acme/shared";
import { describe, expect, it } from "vitest";

import { normalizePagination } from "./pagination.js";

describe("normalizePagination", () => {
  it("computes offset from parsed page and limit", () => {
    expect(
      normalizePagination({
        page: DEFAULT_EMPLOYEE_PAGE,
        limit: DEFAULT_EMPLOYEE_LIMIT,
      }),
    ).toEqual({
      page: DEFAULT_EMPLOYEE_PAGE,
      limit: DEFAULT_EMPLOYEE_LIMIT,
      offset: 0,
    });
  });

  it("calculates offset for later pages", () => {
    expect(normalizePagination({ page: 3, limit: 20 })).toEqual({
      page: 3,
      limit: 20,
      offset: 40,
    });
  });

  it("caps limit at maximum as defense in depth", () => {
    expect(normalizePagination({ page: 1, limit: 500 }).limit).toBe(
      MAX_EMPLOYEE_LIMIT,
    );
  });

  it("floors page at 1", () => {
    expect(normalizePagination({ page: 0, limit: 50 }).page).toBe(1);
  });
});
