import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns ok status with database counts", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      database: "connected",
      employees: 0,
      compensationRecords: 0,
    });
  });
});

describe("GET /unknown", () => {
  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Not Found");
  });
});
