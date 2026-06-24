import path from "node:path";
import { fileURLToPath } from "node:url";

import { FIXTURE_DEFAULT_EMPLOYEE_COUNT } from "../src/domain/fixtures/index.js";
import { logger } from "../src/config/logger.js";
import { generateCompensationSpreadsheet } from "./generate-compensation-spreadsheet.js";
import { generateEmployeeSpreadsheet } from "./generate-employee-spreadsheet.js";
import { parseSpreadsheetRowCountArgument } from "./spreadsheet-script-options.js";

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const totalRows = parseSpreadsheetRowCountArgument(FIXTURE_DEFAULT_EMPLOYEE_COUNT);

await generateEmployeeSpreadsheet(
  totalRows,
  path.join(backendRoot, "fixtures", "employees-10000.xlsx"),
);
await generateCompensationSpreadsheet(
  totalRows,
  path.join(backendRoot, "fixtures", "compensation-10000.xlsx"),
);

logger.info({ totalRows }, "Bulk import fixtures generated");
