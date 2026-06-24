export type SpreadsheetColumnKey =
  | "id"
  | "fullName"
  | "department"
  | "jobTitle"
  | "country";

export type SpreadsheetColumnIndex = Record<SpreadsheetColumnKey, number>;

const HEADER_ALIASES: Record<SpreadsheetColumnKey, readonly string[]> = {
  id: ["id", "employee_id", "employee id", "employeeid"],
  fullName: ["full_name", "fullname", "full name", "name"],
  department: ["department", "dept"],
  jobTitle: ["job_title", "jobtitle", "job title", "title"],
  country: ["country", "country_code", "country code"],
};

export function normalizeSpreadsheetHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveSpreadsheetColumnIndex(
  headers: string[],
): SpreadsheetColumnIndex | null {
  const normalizedHeaders = headers.map(normalizeSpreadsheetHeader);
  const columnIndex = {} as Partial<SpreadsheetColumnIndex>;

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
    [SpreadsheetColumnKey, readonly string[]]
  >) {
    const matchIndex = normalizedHeaders.findIndex((header) =>
      aliases.includes(header),
    );

    if (matchIndex === -1) {
      return null;
    }

    columnIndex[field] = matchIndex;
  }

  return columnIndex as SpreadsheetColumnIndex;
}

export function readSpreadsheetCell(
  row: unknown[],
  columnIndex: number,
): string {
  const value = row[columnIndex];
  return value === undefined || value === null ? "" : String(value).trim();
}

export function isSpreadsheetRowEmpty(row: unknown[]): boolean {
  return row.every(
    (value) =>
      value === undefined ||
      value === null ||
      String(value).trim().length === 0,
  );
}
