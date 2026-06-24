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
