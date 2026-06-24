import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { runSeed } from "../src/db/seed.js";
import { buildCompensationSpreadsheetBuffer } from "../src/domain/parse-compensation-spreadsheet.js";

describe("Compensation import API", () => {
  const app = createApp();

  it("previews a valid compensation spreadsheet", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/import/compensation/preview")
      .attach(
        "file",
        buildCompensationSpreadsheetBuffer([
          {
            employee_id: "E003",
            base_salary: 95000,
            currency: "USD",
            effective_date: "2026-03-01",
            reason: "New Hire",
            changed_by: "HR Admin",
            notes: "Imported offer",
          },
        ]),
        "compensation.xlsx",
      );

    expect(response.status).toBe(200);
    expect(response.body.isValid).toBe(true);
    expect(response.body.records).toHaveLength(1);
  });

  it("imports compensation records through confirm", async () => {
    await runSeed(db);

    const spreadsheetBuffer = buildCompensationSpreadsheetBuffer([
      {
        employee_id: "E003",
        base_salary: 95000,
        currency: "USD",
        effective_date: "2026-03-01",
        reason: "New Hire",
        changed_by: "HR Admin",
        notes: "Imported offer",
      },
    ]);

    const response = await request(app)
      .post("/api/import/compensation/confirm")
      .attach("file", spreadsheetBuffer, "compensation.xlsx");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ inserted: 1, total: 1 });
  });

  it("returns validation errors for unknown employees", async () => {
    await runSeed(db);

    const response = await request(app)
      .post("/api/import/compensation/preview")
      .attach(
        "file",
        buildCompensationSpreadsheetBuffer([
          {
            employee_id: "E404",
            base_salary: 95000,
            currency: "USD",
            effective_date: "2026-03-01",
            reason: "New Hire",
            changed_by: "HR Admin",
            notes: "",
          },
        ]),
        "compensation.xlsx",
      );

    expect(response.status).toBe(200);
    expect(response.body.isValid).toBe(false);
    expect(response.body.errors[0]?.field).toBe("employeeId");
  });
});
