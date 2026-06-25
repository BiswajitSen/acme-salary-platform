import { analyticsSummaryQuerySchema } from "@acme/shared";

const SQL_INJECTION_PATTERN =
  /(\b(select|insert|update|delete|drop|alter|truncate)\b|--|;)/i;

export function looksLikeSqlInjection(normalizedQuery: string): boolean {
  return SQL_INJECTION_PATTERN.test(normalizedQuery);
}

export function isAllowedInsightDepartment(
  department: string,
  allowedDepartments: readonly string[],
): boolean {
  return allowedDepartments.includes(department);
}

export function isAllowedInsightCountry(
  country: string,
  allowedCountries: readonly string[],
): boolean {
  return allowedCountries.includes(country);
}

export function parseSafeInsightCurrency(currency: string): string | null {
  const result = analyticsSummaryQuerySchema.safeParse({ currency });

  if (!result.success) {
    return null;
  }

  return result.data.currency;
}
