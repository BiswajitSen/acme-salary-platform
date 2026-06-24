import { count } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../src/db/index.js";
import { compensationHistory } from "../src/db/schema.js";
import { createEmployeeSpreadsheetRows } from "../src/domain/fixtures/index.js";
import { buildCompensationSpreadsheetBuffer } from "../src/domain/parse-compensation-spreadsheet.js";
import { buildEmployeeSpreadsheetBuffer } from "../src/domain/parse-employee-spreadsheet.js";
import { DrizzleCompensationRepository } from "../src/repositories/drizzle/compensation.repository.js";
import { DrizzleEmployeeRepository } from "../src/repositories/drizzle/employee.repository.js";
import { CompensationImportService } from "../src/services/compensation-import.service.js";
import { EmployeeImportService } from "../src/services/employee-import.service.js";

const reasons = ["New Hire", "Annual Increment", "Promotion"] as const;

function buildCompensationSpreadsheetRows(totalEmployees: number, recordsPerEmployee: number) {
  const rows: Array<Record<string, string | number>> = [];

  for (let employeeNumber = 1; employeeNumber <= totalEmployees; employeeNumber += 1) {
    const employeeId = `E${String(employeeNumber).padStart(5, "0")}`;

    for (let recordIndex = 0; recordIndex < recordsPerEmployee; recordIndex += 1) {
      const year = 2020 + recordIndex;
      rows.push({
        employee_id: employeeId,
        base_salary: 80_000 + employeeNumber + recordIndex * 1_000,
        currency: "USD",
        effective_date: `${year}-01-01`,
        reason: reasons[recordIndex % reasons.length]!,
        changed_by: "HR Admin",
        notes: "",
      });
    }
  }

  return rows;
}

describe("CompensationImportService integration", () => {
  const employeeRepository = new DrizzleEmployeeRepository(db);
  const compensationRepository = new DrizzleCompensationRepository(db);
  const employeeImportService = new EmployeeImportService(employeeRepository);
  const compensationImportService = new CompensationImportService(
    employeeRepository,
    compensationRepository,
  );

  it("imports twenty thousand compensation records from an xlsx spreadsheet", async () => {
    await employeeImportService.importEmployeeSpreadsheet(
      buildEmployeeSpreadsheetBuffer(createEmployeeSpreadsheetRows(10_000)),
    );

    const spreadsheetBuffer = buildCompensationSpreadsheetBuffer(
      buildCompensationSpreadsheetRows(10_000, 2),
    );

    const startedAt = performance.now();
    const result =
      await compensationImportService.importCompensationSpreadsheet(spreadsheetBuffer);
    const elapsedMs = performance.now() - startedAt;

    const countRows = await db.select({ value: count() }).from(compensationHistory);
    const totalCompensationRecords = countRows[0]?.value ?? 0;

    expect(result.total).toBe(20_000);
    expect(totalCompensationRecords).toBeGreaterThanOrEqual(20_000);
    expect(elapsedMs).toBeLessThan(60_000);
  }, 90_000);
});
