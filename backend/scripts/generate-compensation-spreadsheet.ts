import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createCompensationSpreadsheetRows } from "../src/domain/fixtures/index.js";
import { buildCompensationSpreadsheetBuffer } from "../src/domain/parse-compensation-spreadsheet.js";
import { logger } from "../src/config/logger.js";
import {
  isDirectScriptRun,
  parseSpreadsheetOutputArgument,
  parseSpreadsheetRowCountArgument,
} from "./spreadsheet-script-options.js";

export async function generateCompensationSpreadsheet(
  totalRows: number,
  outputPath: string,
): Promise<void> {
  const spreadsheetBuffer = buildCompensationSpreadsheetBuffer(
    createCompensationSpreadsheetRows(totalRows),
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, spreadsheetBuffer);
}

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutput = path.join(backendRoot, "fixtures", "compensation-10000.xlsx");

if (isDirectScriptRun("generate-compensation-spreadsheet.ts")) {
  const totalRows = parseSpreadsheetRowCountArgument();
  const outputPath = path.resolve(parseSpreadsheetOutputArgument(defaultOutput));

  await generateCompensationSpreadsheet(totalRows, outputPath);
  logger.info({ totalRows, outputPath }, "Compensation spreadsheet generated");
}
