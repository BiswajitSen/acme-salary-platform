export const DEFAULT_SPREADSHEET_ROW_COUNT = 10_000;

export function parseSpreadsheetRowCountArgument(defaultCount = DEFAULT_SPREADSHEET_ROW_COUNT): number {
  const countFlagIndex = process.argv.findIndex((argument) => argument === "--count");
  const countValue = countFlagIndex === -1 ? undefined : process.argv[countFlagIndex + 1];
  const parsedCount = Number(countValue ?? defaultCount);

  if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
    throw new Error("Count must be a positive integer");
  }

  return parsedCount;
}

export function parseSpreadsheetOutputArgument(defaultOutput: string): string {
  const outputFlagIndex = process.argv.findIndex((argument) => argument === "--output");
  return outputFlagIndex === -1
    ? defaultOutput
    : String(process.argv[outputFlagIndex + 1]);
}

export function isDirectScriptRun(scriptFileName: string): boolean {
  return process.argv[1]?.endsWith(scriptFileName) ?? false;
}
