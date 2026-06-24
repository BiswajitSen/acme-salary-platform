type SalaryEntry = {
  baseSalary: number;
  currency: string;
};

export function calculateTotalPayrollForSingleCurrency(entries: SalaryEntry[]): number {
  if (entries.length === 0) {
    return 0;
  }

  const uniqueCurrencies = new Set(entries.map((entry) => entry.currency));

  if (uniqueCurrencies.size > 1) {
    throw new Error("Cannot sum salaries across multiple currencies");
  }

  return entries.reduce((total, entry) => total + entry.baseSalary, 0);
}

export function groupCompensationEntriesByCurrency<T extends SalaryEntry>(
  entries: T[],
): Map<string, T[]> {
  const groupedEntries = new Map<string, T[]>();

  for (const entry of entries) {
    const existingEntries = groupedEntries.get(entry.currency) ?? [];
    existingEntries.push(entry);
    groupedEntries.set(entry.currency, existingEntries);
  }

  return groupedEntries;
}
