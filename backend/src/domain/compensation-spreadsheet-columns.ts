export type CompensationSpreadsheetColumnKey =
  | "employeeId"
  | "baseSalary"
  | "currency"
  | "effectiveDate"
  | "reason"
  | "changedBy"
  | "notes";

export type CompensationSpreadsheetColumnIndex = Record<
  CompensationSpreadsheetColumnKey,
  number
>;

const HEADER_ALIASES: Record<
  CompensationSpreadsheetColumnKey,
  readonly string[]
> = {
  employeeId: ["employee_id", "employee id", "employeeid", "id"],
  baseSalary: ["base_salary", "base salary", "basesalary", "salary"],
  currency: ["currency", "currency_code", "currency code"],
  effectiveDate: [
    "effective_date",
    "effective date",
    "effectivedate",
    "start_date",
    "start date",
  ],
  reason: ["reason", "change_reason", "change reason"],
  changedBy: ["changed_by", "changed by", "changedby", "updated_by", "updated by"],
  notes: ["notes", "note", "comments", "comment"],
};

export function normalizeCompensationSpreadsheetHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveCompensationSpreadsheetColumnIndex(
  headers: string[],
): CompensationSpreadsheetColumnIndex | null {
  const normalizedHeaders = headers.map(normalizeCompensationSpreadsheetHeader);
  const columnIndex = {} as Partial<CompensationSpreadsheetColumnIndex>;

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
    [CompensationSpreadsheetColumnKey, readonly string[]]
  >) {
    const matchIndex = normalizedHeaders.findIndex((header) =>
      aliases.includes(header),
    );

    if (matchIndex === -1) {
      return null;
    }

    columnIndex[field] = matchIndex;
  }

  return columnIndex as CompensationSpreadsheetColumnIndex;
}

export function readCompensationSpreadsheetCell(
  row: unknown[],
  columnIndex: number,
): string {
  const value = row[columnIndex];
  return value === undefined || value === null ? "" : String(value).trim();
}

export function isCompensationSpreadsheetRowEmpty(row: unknown[]): boolean {
  return row.every(
    (value) =>
      value === undefined ||
      value === null ||
      String(value).trim().length === 0,
  );
}
