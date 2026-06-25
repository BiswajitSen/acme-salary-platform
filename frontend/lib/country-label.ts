const COUNTRY_LABELS: Record<string, string> = {
  US: "USA",
  UK: "UK",
  IN: "India",
  SG: "Singapore",
  DE: "Germany",
};

export function countryLabel(countryCode: string): string {
  const normalized = countryCode.toUpperCase();
  return COUNTRY_LABELS[normalized] ?? normalized;
}
