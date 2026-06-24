export type EmployeeSpreadsheetColumnKey =
  | "id"
  | "fullName"
  | "department"
  | "jobTitle"
  | "country";

export type EmployeeSpreadsheetColumnIndex = Record<
  EmployeeSpreadsheetColumnKey,
  number
>;

const HEADER_ALIASES: Record<EmployeeSpreadsheetColumnKey, readonly string[]> = {
  id: ["id", "employee_id", "employee id", "employeeid"],
  fullName: ["full_name", "fullname", "full name", "name"],
  department: ["department", "dept"],
  jobTitle: ["job_title", "jobtitle", "job title", "title"],
  country: ["country", "country_code", "country code"],
};

export function normalizeEmployeeSpreadsheetHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveEmployeeSpreadsheetColumnIndex(
  headers: string[],
): EmployeeSpreadsheetColumnIndex | null {
  const normalizedHeaders = headers.map(normalizeEmployeeSpreadsheetHeader);
  const columnIndex = {} as Partial<EmployeeSpreadsheetColumnIndex>;

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
    [EmployeeSpreadsheetColumnKey, readonly string[]]
  >) {
    const matchIndex = normalizedHeaders.findIndex((header) =>
      aliases.includes(header),
    );

    if (matchIndex === -1) {
      return null;
    }

    columnIndex[field] = matchIndex;
  }

  return columnIndex as EmployeeSpreadsheetColumnIndex;
}

export function readEmployeeSpreadsheetCell(
  row: unknown[],
  columnIndex: number,
): string {
  const value = row[columnIndex];
  return value === undefined || value === null ? "" : String(value).trim();
}

export function isEmployeeSpreadsheetRowEmpty(row: unknown[]): boolean {
  return row.every(
    (value) =>
      value === undefined ||
      value === null ||
      String(value).trim().length === 0,
  );
}
