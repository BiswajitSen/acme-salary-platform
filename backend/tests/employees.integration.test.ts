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
    expect(response.body.meta).toMatchObject({ page: 1, limit: 50 });
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("filters employees by search term", async () => {
    await db.insert(employees).values({
      id: "E200",
      fullName: "Directory Search Target",
      department: "Finance",
      jobTitle: "Analyst",
      country: "SG",
    });

    const response = await request(app).get("/api/employees?search=Directory");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "E200", fullName: "Directory Search Target" }),
      ]),
    );
  });

  it("filters employees by country and department", async () => {
    const response = await request(app).get(
      "/api/employees?country=SG&department=Finance",
    );

    expect(response.status).toBe(200);
    expect(response.body.data.every((employee: { country: string }) => employee.country === "SG")).toBe(
      true,
    );
  });

  it("returns 400 for invalid limit", async () => {
    const response = await request(app).get("/api/employees?limit=500");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation Error");
  });
});

describe("GET /api/employees/filter-options", () => {
  const app = createApp();

  it("returns distinct filter values", async () => {
    const response = await request(app).get("/api/employees/filter-options");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      countries: expect.any(Array),
      departments: expect.any(Array),
      jobTitles: expect.any(Array),
    });
  });
});

describe("Employee CRUD API", () => {
  const app = createApp();

  it("creates, updates, and deletes an employee without compensation history", async () => {
    const createResponse = await request(app).post("/api/employees").send({
      id: "E900",
      fullName: "CRUD Target",
      department: "Operations",
      jobTitle: "Coordinator",
      country: "US",
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      id: "E900",
      fullName: "CRUD Target",
      currentCompensation: null,
    });

    const updateResponse = await request(app).patch("/api/employees/E900").send({
      fullName: "CRUD Updated",
      department: "Operations",
      jobTitle: "Lead Coordinator",
      country: "US",
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.fullName).toBe("CRUD Updated");

    const deleteResponse = await request(app).delete("/api/employees/E900");

    expect(deleteResponse.status).toBe(204);

    const profileResponse = await request(app).get("/api/employees/E900");

    expect(profileResponse.status).toBe(404);
  });

  it("rejects duplicate employee creation", async () => {
    await db.insert(employees).values({
      id: "E901",
      fullName: "Existing Employee",
      department: "Finance",
      jobTitle: "Analyst",
      country: "SG",
    });

    const response = await request(app).post("/api/employees").send({
      id: "E901",
      fullName: "Duplicate",
      department: "Finance",
      jobTitle: "Analyst",
      country: "SG",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Employee E901 already exists");
  });

  it("rejects delete when compensation history exists", async () => {
    await request(app).post("/api/employees").send({
      id: "E902",
      fullName: "Protected Employee",
      department: "Finance",
      jobTitle: "Analyst",
      country: "US",
    });

    await request(app).post("/api/employees/E902/compensation").send({
      baseSalary: 100_000,
      currency: "USD",
      effectiveDate: "2026-01-01",
      reason: "New Hire",
      changedBy: "HR Admin",
    });

    const response = await request(app).delete("/api/employees/E902");

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Cannot delete an employee with compensation history");
  });
});
