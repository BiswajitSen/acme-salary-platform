import { eq } from "drizzle-orm";
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
  baseSalary: null,
  currency: null,
  employmentStatus: "NO_COMPENSATION",
};

const hrEmployee: EmployeeSummary = {
  id: "E002",
  fullName: "Bob Smith",
  department: "HR",
  jobTitle: "HR Manager",
  country: "UK",
  baseSalary: null,
  currency: null,
  employmentStatus: "NO_COMPENSATION",
};

const emptyStats = {
  total: 0,
  active: 0,
  noCompensation: 0,
  departments: 0,
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
      filters: { countries: ["SG"] },
    });

    expect(result).toEqual({ data: [], total: 0, stats: emptyStats });
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
      filters: { departments: ["HR"] },
    });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.data.every((employee) => employee.department === "HR")).toBe(true);
  });

  it("filters employees missing compensation", async () => {
    await seedDirectoryFixtures();

    const result = await repository.findPaginated({
      page: 1,
      limit: 50,
      offset: 0,
      filters: { employmentStatuses: ["NO_COMPENSATION"] },
    });

    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(
      result.data.every((employee) => employee.employmentStatus === "NO_COMPENSATION"),
    ).toBe(true);
  });

  it("applies country, department, and job title filters together", async () => {
    await seedDirectoryFixtures();

    const result = await repository.findPaginated({
      page: 1,
      limit: 50,
      offset: 0,
      filters: {
        countries: ["US"],
        departments: ["Engineering"],
        jobTitles: ["Senior Engineer"],
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

    const options = await repository.findDistinctEmployeeFilterValues();

    expect(options.countries).toContain("US");
    expect(options.departments).toContain("Engineering");
    expect(options.jobTitles).toContain("Senior Engineer");
  });

  it("returns an employee by id", async () => {
    await seedDirectoryFixtures();

    await expect(repository.findEmployeeById("E001")).resolves.toMatchObject(
      engineeringEmployee,
    );
  });

  it("returns null when an employee id is unknown", async () => {
    await expect(repository.findEmployeeById("E404")).resolves.toBeNull();
  });

  it("returns existing employee ids in bulk", async () => {
    await seedDirectoryFixtures();

    await expect(
      repository.findExistingEmployeeIds(["E001", "E404", "E002"]),
    ).resolves.toEqual(new Set(["E001", "E002"]));
  });

  it("returns an empty set when no employee ids are provided", async () => {
    await expect(repository.findExistingEmployeeIds([])).resolves.toEqual(new Set());
  });

  it("inserts new employees through upsertManyEmployees", async () => {
    const result = await repository.upsertManyEmployees([
      {
        id: "E500",
        fullName: "Import Target",
        department: "Finance",
        jobTitle: "Analyst",
        country: "SG",
      },
    ]);

    expect(result).toEqual({ inserted: 1, updated: 0, total: 1 });
  });

  it("updates existing employees through upsertManyEmployees", async () => {
    await repository.upsertManyEmployees([
      {
        id: "E501",
        fullName: "Original Name",
        department: "Engineering",
        jobTitle: "Engineer",
        country: "US",
      },
    ]);

    const result = await repository.upsertManyEmployees([
      {
        id: "E501",
        fullName: "Updated Name",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
      },
    ]);

    const [employee] = await db
      .select({
        fullName: employees.fullName,
        jobTitle: employees.jobTitle,
      })
      .from(employees)
      .where(eq(employees.id, "E501"));

    expect(result).toEqual({ inserted: 0, updated: 1, total: 1 });
    expect(employee).toEqual({
      fullName: "Updated Name",
      jobTitle: "Senior Engineer",
    });
  });

  it("inserts a single employee", async () => {
    const employee = await repository.insertEmployee({
      id: "E510",
      fullName: "Created Employee",
      department: "Finance",
      jobTitle: "Analyst",
      country: "SG",
    });

    expect(employee).toMatchObject({
      id: "E510",
      fullName: "Created Employee",
      employmentStatus: "NO_COMPENSATION",
    });
  });

  it("updates a single employee", async () => {
    await repository.insertEmployee({
      id: "E511",
      fullName: "Before Update",
      department: "Finance",
      jobTitle: "Analyst",
      country: "SG",
    });

    const updatedEmployee = await repository.updateEmployee("E511", {
      fullName: "After Update",
      department: "HR",
      jobTitle: "Manager",
      country: "US",
    });

    expect(updatedEmployee).toMatchObject({
      id: "E511",
      fullName: "After Update",
      department: "HR",
    });
  });

  it("deletes a single employee", async () => {
    await repository.insertEmployee({
      id: "E512",
      fullName: "Delete Me",
      department: "Finance",
      jobTitle: "Analyst",
      country: "SG",
    });

    await repository.deleteEmployee("E512");

    expect(await repository.findEmployeeById("E512")).toBeNull();
  });
});
