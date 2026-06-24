import path from "node:path";
import { fileURLToPath } from "node:url";

import { logger } from "../src/config/logger.js";
import { generateCompensationSpreadsheet } from "./generate-compensation-spreadsheet.js";
import { generateEmployeeSpreadsheet } from "./generate-employee-spreadsheet.js";

function parseCountArgument(defaultCount: number): number {
  const countFlagIndex = process.argv.findIndex((argument) => argument === "--count");
  const countValue = countFlagIndex === -1 ? undefined : process.argv[countFlagIndex + 1];
  const parsedCount = Number(countValue ?? defaultCount);

  if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
    throw new Error("Count must be a positive integer");
  }

  return parsedCount;
}

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const totalRows = parseCountArgument(10_000);

await generateEmployeeSpreadsheet(
  totalRows,
  path.join(backendRoot, "fixtures", "employees-10000.xlsx"),
);
await generateCompensationSpreadsheet(
  totalRows,
  path.join(backendRoot, "fixtures", "compensation-10000.xlsx"),
);

logger.info({ totalRows }, "Bulk import fixtures generated");
