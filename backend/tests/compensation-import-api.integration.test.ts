import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { runSeed } from "../src/db/seed.js";
import { buildCompensationSpreadsheetBuffer } from "../src/domain/parse-compensation-spreadsheet.js";
import { buildEmployeeSpreadsheetBuffer } from "../src/domain/parse-employee-spreadsheet.js";
import { DrizzleEmployeeRepository } from "../src/repositories/drizzle/employee.repository.js";
import { EmployeeImportService } from "../src/services/employee-import.service.js";

const departments = ["Engineering", "HR", "Finance", "Sales", "Operations"];
const countries = ["US", "UK", "SG", "DE", "IN"];
const jobTitles = ["Analyst", "Manager", "Engineer", "Director", "Coordinator"];
const reasons = ["New Hire", "Annual Increment", "Promotion"] as const;

function buildEmployeeSpreadsheetRows(totalEmployees: number) {
  return Array.from({ length: totalEmployees }, (_, index) => {
    const employeeNumber = index + 1;

    return {
      employee_id: `E${String(employeeNumber).padStart(5, "0")}`,
      full_name: `Employee ${employeeNumber}`,
      department: departments[index % departments.length]!,
      job_title: jobTitles[index % jobTitles.length]!,
      country: countries[index % countries.length]!,
    };
  });
}

function buildLargeCompensationSpreadsheetRows(recordCount: number) {
  const rows: Array<Record<string, string | number>> = [];

  for (let employeeNumber = 1; rows.length < recordCount; employeeNumber += 1) {
    const employeeId = `E${String(employeeNumber).padStart(5, "0")}`;

    for (let recordIndex = 0; recordIndex < 3 && rows.length < recordCount; recordIndex += 1) {
      rows.push({
        employee_id: employeeId,
        base_salary: 80_000 + employeeNumber + recordIndex * 1_000,
        currency: "USD",
        effective_date: `${2020 + recordIndex}-01-01`,
        reason: reasons[recordIndex % reasons.length]!,
        changed_by: "HR Admin",
        notes: "",
      });
    }
  }

  return rows;
}

describe("Compensation import API", () => {
  const app = createApp();
  const employeeImportService = new EmployeeImportService(new DrizzleEmployeeRepository(db));

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
    expect(response.body.recordCount).toBe(1);
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

  it("imports twenty-one thousand compensation records through confirm", async () => {
    await employeeImportService.importEmployeeSpreadsheet(
      buildEmployeeSpreadsheetBuffer(buildEmployeeSpreadsheetRows(10_000)),
    );

    const spreadsheetBuffer = buildCompensationSpreadsheetBuffer(
      buildLargeCompensationSpreadsheetRows(21_531),
    );

    const previewResponse = await request(app)
      .post("/api/import/compensation/preview")
      .attach("file", spreadsheetBuffer, "compensation.xlsx");

    expect(previewResponse.status).toBe(200);
    expect(previewResponse.body.isValid).toBe(true);
    expect(previewResponse.body.recordCount).toBe(21_531);

    const confirmResponse = await request(app)
      .post("/api/import/compensation/confirm")
      .attach("file", spreadsheetBuffer, "compensation.xlsx");

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body).toEqual({ inserted: 21_531, total: 21_531 });
  }, 90_000);
});
