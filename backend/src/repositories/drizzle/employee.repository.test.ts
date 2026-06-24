import type { EmployeeSummary } from "@acme/shared";
import { describe, expect, it } from "vitest";

import { db } from "../../db/index.js";
import { employees } from "../../db/schema.js";
import { DrizzleEmployeeRepository } from "./employee.repository.js";

describe("DrizzleEmployeeRepository", () => {
  const repository = new DrizzleEmployeeRepository(db);

  it("returns empty paginated result when no employees exist", async () => {
    const result = await repository.findPaginated({
      page: 1,
      limit: 50,
      offset: 0,
    });

    expect(result).toEqual({ data: [], total: 0 });
  });

  it("returns a page of employees ordered by id", async () => {
    await db.insert(employees).values([
      {
        id: "E002",
        fullName: "Bob Smith",
        department: "HR",
        jobTitle: "HR Manager",
        country: "UK",
      },
      {
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
      },
    ]);

    const result = await repository.findPaginated({
      page: 1,
      limit: 1,
      offset: 0,
    });

    expect(result.total).toBe(2);
    expect(result.data).toEqual([
      {
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
      } satisfies EmployeeSummary,
    ]);
  });

  it("respects offset for subsequent pages", async () => {
    const page2 = await repository.findPaginated({
      page: 2,
      limit: 1,
      offset: 1,
    });

    expect(page2.data[0]?.id).toBe("E002");
  });
});
