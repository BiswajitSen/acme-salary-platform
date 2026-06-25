import type { InsightQueryCountry } from "@acme/shared";

type CountryAlias = {
  pattern: RegExp;
  country: InsightQueryCountry;
};

const INSIGHT_COUNTRY_ALIASES: readonly CountryAlias[] = [
  { pattern: /\b(?:india|indian|inida)\b/i, country: "IN" },
  { pattern: /\b(?:united states|america|american|usa)\b/i, country: "US" },
  { pattern: /\b(?:united kingdom|britain|british|uk)\b/i, country: "UK" },
  { pattern: /\b(?:singapore|singaporean)\b/i, country: "SG" },
  { pattern: /\b(?:germany|german)\b/i, country: "DE" },
];

const FOR_COUNTRY_CODE_PATTERN = /\bfor\s+(US|UK|SG|DE|IN|USA)\b/i;
const IN_COUNTRY_CODE_PATTERN = /\bin\s+(US|UK|SG|DE|IN)\b(?:\s*\?)?$/i;
const ISO_COUNTRY_CODE_PATTERN = /\b(US|UK|SG|DE)\b/i;

function normalizeCountryToken(token: string): string {
  return token.toUpperCase() === "USA" ? "US" : token.toUpperCase();
}

export function extractInsightCountry(normalizedQuery: string): string | null {
  for (const alias of INSIGHT_COUNTRY_ALIASES) {
    if (alias.pattern.test(normalizedQuery)) {
      return alias.country;
    }
  }

  const forCountryMatch = normalizedQuery.match(FOR_COUNTRY_CODE_PATTERN);
  if (forCountryMatch) {
    return normalizeCountryToken(forCountryMatch[1]!);
  }

  const explicitCountryMatch = normalizedQuery.match(IN_COUNTRY_CODE_PATTERN);
  if (explicitCountryMatch) {
    return explicitCountryMatch[1]!.toUpperCase();
  }

  const isoMatch = normalizedQuery.match(ISO_COUNTRY_CODE_PATTERN);
  if (isoMatch) {
    return isoMatch[1]!.toUpperCase();
  }

  return null;
}
