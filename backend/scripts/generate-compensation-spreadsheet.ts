import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCompensationSpreadsheetRows } from "../src/domain/bulk-import-fixtures.js";
import { buildCompensationSpreadsheetBuffer } from "../src/domain/parse-compensation-spreadsheet.js";
import { logger } from "../src/config/logger.js";

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

export async function generateCompensationSpreadsheet(
  totalRows: number,
  outputPath: string,
): Promise<void> {
  const spreadsheetBuffer = buildCompensationSpreadsheetBuffer(
    buildCompensationSpreadsheetRows(totalRows),
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, spreadsheetBuffer);
}

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutput = path.join(backendRoot, "fixtures", "compensation-10000.xlsx");
const isDirectRun = process.argv[1]?.endsWith("generate-compensation-spreadsheet.ts");

if (isDirectRun) {
  const totalRows = parseCountArgument(10_000);
  const outputPath = path.resolve(parseOutputArgument(defaultOutput));

  await generateCompensationSpreadsheet(totalRows, outputPath);
  logger.info({ totalRows, outputPath }, "Compensation spreadsheet generated");
}
