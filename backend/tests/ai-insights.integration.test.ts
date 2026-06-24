import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

describe("POST /api/insights/parse", () => {
  const app = createApp();

  it("returns AVG_DEPT_SALARY for an average department salary question", async () => {
    const response = await request(app)
      .post("/api/insights/parse")
      .send({ query: "What is the average salary in Engineering?" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "What is the average salary in Engineering?",
      department: "Engineering",
      currency: null,
    });
  });

  it("returns UNKNOWN for unsupported questions", async () => {
    const response = await request(app)
      .post("/api/insights/parse")
      .send({ query: "Tell me a joke" });

    expect(response.status).toBe(200);
    expect(response.body.intent).toBe("UNKNOWN");
  });
});
