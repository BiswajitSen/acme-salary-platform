import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { employees } from "../src/db/schema.js";

describe("GET /api/employees", () => {
  const app = createApp();

  it("returns paginated employees with default page size of 50", async () => {
    const response = await request(app).get("/api/employees");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [],
      meta: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it("returns seeded employees", async () => {
    await db.insert(employees).values({
      id: "E100",
      fullName: "Alice Chen",
      department: "Finance",
      jobTitle: "Analyst",
      country: "SG",
    });

    const response = await request(app).get("/api/employees");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: "E100",
      fullName: "Alice Chen",
    });
  });

  it("returns 400 for invalid limit", async () => {
    const response = await request(app).get("/api/employees?limit=500");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation Error");
  });
});

describe("createContainer", () => {
  it("wires employee service with drizzle repository", async () => {
    const { createContainer } = await import("../src/container/index.js");
    const container = createContainer(db);

    expect(container.employeeService).toBeDefined();
    expect(container.employeeRepository).toBeDefined();

    const result = await container.employeeService.list({});
    expect(result.meta).toMatchObject({ page: 1, limit: 50 });
  });
});
