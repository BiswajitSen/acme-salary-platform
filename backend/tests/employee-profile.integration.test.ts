import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { runSeed } from "../src/db/seed.js";

describe("Employee profile API", () => {
  const app = createApp();

  it("returns an employee profile with current compensation", async () => {
    await runSeed(db);

    const response = await request(app).get("/api/employees/E001");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "E001",
      fullName: "Jane Doe",
      currentCompensation: {
        baseSalary: 132_000,
        currency: "USD",
        reason: "Annual Increment",
      },
    });
  });

  it("returns 404 for an unknown employee profile", async () => {
    const response = await request(app).get("/api/employees/E404");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Employee E404 not found");
  });

  it("returns newest-first compensation history for an employee", async () => {
    await runSeed(db);

    const response = await request(app).get("/api/employees/E001/compensation");

    expect(response.status).toBe(200);
    expect(response.body.entries[0]?.baseSalary).toBe(132_000);
    expect(response.body.entries[0]?.previousSalary).toBe(120_000);
  });

  it("returns an empty timeline for an employee without compensation history", async () => {
    await runSeed(db);

    const response = await request(app).get("/api/employees/E003/compensation");

    expect(response.status).toBe(200);
    expect(response.body.entries).toEqual([]);
  });
});
