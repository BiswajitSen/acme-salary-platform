import fs from "node:fs/promises";
import path from "node:path";

import { logger } from "../config/logger.js";
import { db } from "./index.js";
import { DrizzleEmployeeRepository } from "../repositories/drizzle/employee.repository.js";
import { EmployeeImportService } from "../services/employee-import.service.js";
import { EmployeeImportValidationError } from "../lib/employee-import-validation-error.js";

export async function runEmployeeImport(
  spreadsheetPath: string,
): Promise<void> {
  const absolutePath = path.resolve(spreadsheetPath);
  const spreadsheetBuffer = await fs.readFile(absolutePath);
  const importService = new EmployeeImportService(new DrizzleEmployeeRepository(db));

  try {
    const result = await importService.importSpreadsheet(spreadsheetBuffer);
    logger.info({ file: absolutePath, ...result }, "Employee spreadsheet import complete");
  } catch (error) {
    if (error instanceof EmployeeImportValidationError) {
      logger.error(
        { file: absolutePath, errors: error.errors },
        "Employee spreadsheet validation failed",
      );
      process.exitCode = 1;
      return;
    }

    throw error;
  }
}

const spreadsheetPath = process.argv[2];
const isDirectRun = process.argv[1]?.endsWith("import-employees.ts");

if (isDirectRun) {
  if (!spreadsheetPath) {
    logger.error("Usage: npm run db:import -w backend -- <path-to-xlsx>");
    process.exit(1);
  }

  await runEmployeeImport(spreadsheetPath);
}
