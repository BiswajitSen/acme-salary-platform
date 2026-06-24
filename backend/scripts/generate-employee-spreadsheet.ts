import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createEmployeeSpreadsheetRows } from "../src/domain/fixtures/index.js";
import { buildEmployeeSpreadsheetBuffer } from "../src/domain/parse-employee-spreadsheet.js";
import { logger } from "../src/config/logger.js";
import {
  DEFAULT_SPREADSHEET_ROW_COUNT,
  isDirectScriptRun,
  parseSpreadsheetOutputArgument,
  parseSpreadsheetRowCountArgument,
} from "./spreadsheet-script-options.js";

export async function generateEmployeeSpreadsheet(
  totalRows: number,
  outputPath: string,
): Promise<void> {
  const spreadsheetBuffer = buildEmployeeSpreadsheetBuffer(
    createEmployeeSpreadsheetRows(totalRows),
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, spreadsheetBuffer);
}

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutput = path.join(backendRoot, "fixtures", "employees-10000.xlsx");

if (isDirectScriptRun("generate-employee-spreadsheet.ts")) {
  const totalRows = parseSpreadsheetRowCountArgument();
  const outputPath = path.resolve(parseSpreadsheetOutputArgument(defaultOutput));

  await generateEmployeeSpreadsheet(totalRows, outputPath);
  logger.info({ totalRows, outputPath }, "Employee spreadsheet generated");
}
