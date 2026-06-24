import type { EmployeeSummary } from "@acme/shared";
import { describe, expect, it } from "vitest";

import { db } from "../../db/index.js";
import { employees } from "../../db/schema.js";
import { DrizzleEmployeeRepository, readAggregateCount } from "./employee.repository.js";

const engineeringEmployee: EmployeeSummary = {
  id: "E001",
  fullName: "Jane Doe",
  department: "Engineering",
  jobTitle: "Senior Engineer",
  country: "US",
};

const hrEmployee: EmployeeSummary = {
  id: "E002",
  fullName: "Bob Smith",
  department: "HR",
  jobTitle: "HR Manager",
  country: "UK",
};

describe("readAggregateCount", () => {
  it("returns zero when no aggregate rows are present", () => {
    expect(readAggregateCount([])).toBe(0);
  });

  it("returns the first aggregate value", () => {
    expect(readAggregateCount([{ value: 7 }])).toBe(7);
  });
});

describe("DrizzleEmployeeRepository", () => {
  const repository = new DrizzleEmployeeRepository(db);

  async function seedDirectoryFixtures() {
    await db
      .insert(employees)
      .values([
        {
          id: engineeringEmployee.id,
          fullName: engineeringEmployee.fullName,
          department: engineeringEmployee.department,
          jobTitle: engineeringEmployee.jobTitle,
          country: engineeringEmployee.country,
        },
        {
          id: hrEmployee.id,
          fullName: hrEmployee.fullName,
          department: hrEmployee.department,
          jobTitle: hrEmployee.jobTitle,
          country: hrEmployee.country,
        },
      ])
      .onConflictDoNothing();
  }

  it("returns empty paginated result when no employees match", async () => {
    const result = await repository.findPaginated({
      page: 1,
      limit: 50,
      offset: 0,
      filters: { country: "SG" },
    });

    expect(result).toEqual({ data: [], total: 0 });
  });

  it("returns a page of employees ordered by id", async () => {
    await seedDirectoryFixtures();

    const result = await repository.findPaginated({
      page: 1,
      limit: 1,
      offset: 0,
      filters: {},
    });

    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.data[0]).toMatchObject(engineeringEmployee);
  });

  it("matches employees by partial name", async () => {
    await seedDirectoryFixtures();

    const result = await repository.findPaginated({
      page: 1,
      limit: 50,
      offset: 0,
      filters: { search: "jane" },
    });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.data.some((employee) => employee.id === "E001")).toBe(true);
  });

  it("matches employees by id fragment", async () => {
    await seedDirectoryFixtures();

    const result = await repository.findPaginated({
      page: 1,
      limit: 50,
      offset: 0,
      filters: { search: "E002" },
    });

    expect(result.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "E002" })]),
    );
  });

  it("filters by a single attribute", async () => {
    await seedDirectoryFixtures();

    const result = await repository.findPaginated({
      page: 1,
      limit: 50,
      offset: 0,
      filters: { department: "HR" },
    });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.data.every((employee) => employee.department === "HR")).toBe(true);
  });

  it("applies country, department, and job title filters together", async () => {
    await seedDirectoryFixtures();

    const result = await repository.findPaginated({
      page: 1,
      limit: 50,
      offset: 0,
      filters: {
        country: "US",
        department: "Engineering",
        jobTitle: "Senior Engineer",
      },
    });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.data.every((employee) => employee.country === "US")).toBe(true);
    expect(result.data.every((employee) => employee.department === "Engineering")).toBe(
      true,
    );
  });

  it("returns distinct filter values", async () => {
    await seedDirectoryFixtures();

    const options = await repository.findDistinctFilterValues();

    expect(options.countries).toContain("US");
    expect(options.departments).toContain("Engineering");
    expect(options.jobTitles).toContain("Senior Engineer");
  });
});
