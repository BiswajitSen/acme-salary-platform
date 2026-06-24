import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildEmployeeSpreadsheetBuffer } from "../src/domain/parse-employee-spreadsheet.js";
import { logger } from "../src/config/logger.js";

const departments = ["Engineering", "HR", "Finance", "Sales", "Operations"];
const countries = ["US", "UK", "SG", "DE", "IN"];
const jobTitles = ["Analyst", "Manager", "Engineer", "Director", "Coordinator"];

function parseCountArgument(defaultCount: number): number {
  const countFlagIndex = process.argv.findIndex((argument) => argument === "--count");
  const countValue = countFlagIndex === -1 ? undefined : process.argv[countFlagIndex + 1];
  const parsedCount = Number(countValue ?? defaultCount);

  if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
    throw new Error("Count must be a positive integer");
  }

  return parsedCount;
}

function parseOutputArgument(defaultOutput: string): string {
  const outputFlagIndex = process.argv.findIndex((argument) => argument === "--output");
  return outputFlagIndex === -1
    ? defaultOutput
    : String(process.argv[outputFlagIndex + 1]);
}

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

export async function generateEmployeeSpreadsheet(
  totalRows: number,
  outputPath: string,
): Promise<void> {
  const spreadsheetBuffer = buildEmployeeSpreadsheetBuffer(
    buildEmployeeSpreadsheetRows(totalRows),
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, spreadsheetBuffer);
}

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutput = path.join(backendRoot, "fixtures", "employees-10000.xlsx");

const totalRows = parseCountArgument(10_000);
const outputPath = path.resolve(parseOutputArgument(defaultOutput));

await generateEmployeeSpreadsheet(totalRows, outputPath);
logger.info({ totalRows, outputPath }, "Employee spreadsheet generated");
