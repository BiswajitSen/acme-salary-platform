export function mergeEmployeeFieldOptions(
  canonical: readonly string[],
  fromDirectory: string[],
  currentValue?: string,
): string[] {
  const values = new Set<string>([...canonical, ...fromDirectory]);

  if (currentValue?.trim()) {
    values.add(currentValue.trim());
  }

  return [...values].sort((left, right) => left.localeCompare(right));
}
