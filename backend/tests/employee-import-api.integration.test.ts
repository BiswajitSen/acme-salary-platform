import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { buildEmployeeSpreadsheetBuffer } from "../src/domain/parse-employee-spreadsheet.js";

function buildValidSpreadsheetBuffer() {
  return buildEmployeeSpreadsheetBuffer([
    {
      employee_id: "E900",
      full_name: "Import Api Target",
      department: "Finance",
      job_title: "Analyst",
      country: "SG",
    },
  ]);
}

describe("POST /api/import", () => {
  const app = createApp();

  it("previews a valid employee spreadsheet upload", async () => {
    const response = await request(app)
      .post("/api/import/preview")
      .attach("file", buildValidSpreadsheetBuffer(), "employees.xlsx");

    expect(response.status).toBe(200);
    expect(response.body.isValid).toBe(true);
    expect(response.body.employees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "E900", fullName: "Import Api Target" }),
      ]),
    );
  });

  it("imports employees from a valid spreadsheet upload", async () => {
    const response = await request(app)
      .post("/api/import/confirm")
      .attach("file", buildValidSpreadsheetBuffer(), "employees.xlsx");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
  });

  it("rejects invalid spreadsheets during confirm without writing rows", async () => {
    const invalidSpreadsheet = buildEmployeeSpreadsheetBuffer([
      {
        employee_id: "",
        full_name: "Invalid Employee",
        department: "Finance",
        job_title: "Analyst",
        country: "SG",
      },
    ]);

    const response = await request(app)
      .post("/api/import/confirm")
      .attach("file", invalidSpreadsheet, "employees.xlsx");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "id", rowNumber: 2 }),
      ]),
    );
  });
});
