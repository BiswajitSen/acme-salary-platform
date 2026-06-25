import { describe, expect, it } from "vitest";

import { listEmployeeFilterOptions, listEmployees, getEmployeeProfile, listEmployeeCompensationHistory, recordCompensationChange } from "./employees";

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
          stats: { total: 0, active: 0, noCompensation: 0, departments: 0 },
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
          stats: { total: 0, active: 0, noCompensation: 0, departments: 0 },
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

describe("getEmployeeProfile", () => {
  it("requests an employee profile by id", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/employees/E001");
      return new Response(
        JSON.stringify({
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
          currentCompensation: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(getEmployeeProfile("E001")).resolves.toMatchObject({ id: "E001" });
    global.fetch = originalFetch;
  });
});

describe("listEmployeeCompensationHistory", () => {
  it("requests compensation history by employee id", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/employees/E001/compensation");
      return new Response(
        JSON.stringify({ employeeId: "E001", entries: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(listEmployeeCompensationHistory("E001")).resolves.toEqual({
      employeeId: "E001",
      entries: [],
    });
    global.fetch = originalFetch;
  });
});

describe("recordCompensationChange", () => {
  it("posts a compensation change for an employee", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input, init) => {
      expect(String(input)).toBe("/api/backend/employees/E001/compensation");
      expect(init?.method).toBe("POST");
      return new Response(
        JSON.stringify({
          entry: {
            id: 3,
            baseSalary: 140_000,
            currency: "USD",
            effectiveDate: "2026-06-01",
            reason: "Promotion",
            changedBy: "HR Admin",
            notes: null,
            previousSalary: 132_000,
            createdAt: "2026-06-02T10:00:00.000Z",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(
      recordCompensationChange("E001", {
        baseSalary: 140_000,
        currency: "USD",
        effectiveDate: "2026-06-01",
        reason: "Promotion",
        changedBy: "HR Admin",
      }),
    ).resolves.toMatchObject({ entry: { baseSalary: 140_000 } });

    global.fetch = originalFetch;
  });
});
