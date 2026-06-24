import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import {
  buildCompensationSpreadsheetRows,
  buildEmployeeSpreadsheetRows,
} from "../src/domain/bulk-import-fixtures.js";
import { buildCompensationSpreadsheetBuffer } from "../src/domain/parse-compensation-spreadsheet.js";
import { buildEmployeeSpreadsheetBuffer } from "../src/domain/parse-employee-spreadsheet.js";
import { DrizzleCompensationRepository } from "../src/repositories/drizzle/compensation.repository.js";
import { DrizzleEmployeeRepository } from "../src/repositories/drizzle/employee.repository.js";
import { CompensationImportService } from "../src/services/compensation-import.service.js";
import { EmployeeImportService } from "../src/services/employee-import.service.js";

describe("Analytics API performance", () => {
  const app = createApp();
  const employeeRepository = new DrizzleEmployeeRepository(db);
  const compensationRepository = new DrizzleCompensationRepository(db);
  const employeeImportService = new EmployeeImportService(employeeRepository);
  const compensationImportService = new CompensationImportService(
    employeeRepository,
    compensationRepository,
  );

  it("responds to analytics endpoints in under two seconds with ten thousand employees", async () => {
    await employeeImportService.importEmployeeSpreadsheet(
      buildEmployeeSpreadsheetBuffer(buildEmployeeSpreadsheetRows(10_000)),
    );
    await compensationImportService.importCompensationSpreadsheet(
      buildCompensationSpreadsheetBuffer(buildCompensationSpreadsheetRows(10_000)),
    );

    const endpoints = [
      "/api/analytics/summary?currency=USD",
      "/api/analytics/departments?currency=USD",
      "/api/analytics/top-earners?currency=USD",
    ] as const;

    for (const endpoint of endpoints) {
      const startedAt = performance.now();
      const response = await request(app).get(endpoint);
      const elapsedMs = performance.now() - startedAt;

      expect(response.status).toBe(200);
      expect(elapsedMs).toBeLessThan(2_000);
    }
  }, 120_000);
});
