const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  UK: "🇬🇧",
  SG: "🇸🇬",
  DE: "🇩🇪",
  IN: "🇮🇳",
};

export function countryFlag(countryCode: string): string {
  return COUNTRY_FLAGS[countryCode.toUpperCase()] ?? "🏳️";
}
