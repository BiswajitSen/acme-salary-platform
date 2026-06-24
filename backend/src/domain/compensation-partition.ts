const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export function deriveCompensationMonthKeyFromEffectiveDate(
  effectiveDate: string,
): string {
  return effectiveDate.slice(0, 7);
}

export function buildCompensationPartitionTableName(monthKey: string): string {
  validateCompensationMonthKey(monthKey);
  return `compensation_history_${monthKey.replace("-", "_")}`;
}

export function buildCompensationMonthDateRange(monthKey: string): {
  rangeStart: string;
  rangeEnd: string;
} {
  validateCompensationMonthKey(monthKey);

  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const rangeStart = `${monthKey}-01`;
  let nextYear = year;
  let nextMonth = month + 1;

  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear += 1;
  }

  const rangeEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { rangeStart, rangeEnd };
}

export function validateCompensationMonthKey(monthKey: string): void {
  if (!MONTH_KEY_PATTERN.test(monthKey)) {
    throw new Error(`Invalid compensation month key: ${monthKey}`);
  }
}
