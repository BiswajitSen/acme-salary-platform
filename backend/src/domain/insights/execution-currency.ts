import { DEFAULT_INSIGHT_CURRENCY, type ParsedInsightQuery } from "@acme/shared";

export function resolveInsightExecutionCurrency(
  parsedQuery: ParsedInsightQuery,
  displayCurrency?: string,
): string {
  if (parsedQuery.currency !== null) {
    return parsedQuery.currency;
  }

  if (displayCurrency !== undefined) {
    return displayCurrency;
  }

  return DEFAULT_INSIGHT_CURRENCY;
}
