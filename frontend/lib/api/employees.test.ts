import { describe, expect, it } from "vitest";

import { listEmployeeFilterOptions, listEmployees } from "./employees";

describe("listEmployees", () => {
  it("builds query string from employee list params", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      const url = String(input);
      expect(url).toContain("/api/backend/employees?");
      expect(url).toContain("page=2");
      expect(url).toContain("limit=25");
      expect(url).toContain("search=Jane");
      expect(url).toContain("country=US");
      expect(url).toContain("department=Engineering");
      expect(url).toContain("jobTitle=Senior+Engineer");
      return new Response(
        JSON.stringify({
          data: [],
          meta: { page: 2, limit: 25, total: 0, totalPages: 0 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await listEmployees({
      page: 2,
      limit: 25,
      search: "Jane",
      country: "US",
      department: "Engineering",
      jobTitle: "Senior Engineer",
    });
    global.fetch = originalFetch;
  });

  it("requests employees without query params by default", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/employees");
      return new Response(
        JSON.stringify({
          data: [],
          meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await listEmployees();
    global.fetch = originalFetch;
  });
});

describe("listEmployeeFilterOptions", () => {
  it("requests filter options from the backend proxy", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/employees/filter-options");
      return new Response(
        JSON.stringify({
          countries: ["US"],
          departments: ["Engineering"],
          jobTitles: ["Senior Engineer"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(listEmployeeFilterOptions()).resolves.toEqual({
      countries: ["US"],
      departments: ["Engineering"],
      jobTitles: ["Senior Engineer"],
    });
    global.fetch = originalFetch;
  });
});
