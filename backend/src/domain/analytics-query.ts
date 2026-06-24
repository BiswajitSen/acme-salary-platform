import { analyticsSummaryQuerySchema } from "@acme/shared";

export function parseAnalyticsCurrencyQuery(query: unknown): string {
  return analyticsSummaryQuerySchema.parse(query).currency;
}
