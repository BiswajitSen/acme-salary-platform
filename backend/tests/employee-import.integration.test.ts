import { count } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../src/db/index.js";
import { employees } from "../src/db/schema.js";
import { buildEmployeeSpreadsheetBuffer } from "../src/domain/parse-employee-spreadsheet.js";
import { DrizzleEmployeeRepository } from "../src/repositories/drizzle/employee.repository.js";
import { EmployeeImportService } from "../src/services/employee-import.service.js";

const departments = ["Engineering", "HR", "Finance", "Sales", "Operations"];
const countries = ["US", "UK", "SG", "DE", "IN"];
const jobTitles = ["Analyst", "Manager", "Engineer", "Director", "Coordinator"];

function buildEmployeeSpreadsheetRows(totalRows: number) {
  return Array.from({ length: totalRows }, (_, index) => {
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

describe("EmployeeImportService integration", () => {
  const importService = new EmployeeImportService(new DrizzleEmployeeRepository(db));

  it("imports ten thousand employees from an xlsx spreadsheet", async () => {
    const spreadsheetBuffer = buildEmployeeSpreadsheetBuffer(
      buildEmployeeSpreadsheetRows(10_000),
    );

    const startedAt = performance.now();
    const result = await importService.importSpreadsheet(spreadsheetBuffer);
    const elapsedMs = performance.now() - startedAt;

    const countRows = await db.select({ value: count() }).from(employees);
    const totalEmployees = countRows[0]?.value ?? 0;

    expect(result.total).toBe(10_000);
    expect(totalEmployees).toBeGreaterThanOrEqual(10_000);
    expect(elapsedMs).toBeLessThan(15_000);
  }, 30_000);
});
