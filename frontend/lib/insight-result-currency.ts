import type { InsightExecutionResult } from "@acme/shared";

export function getInsightResultCurrency(
  result: InsightExecutionResult | null | undefined,
): string | undefined {
  if (result !== null && result !== undefined && "currency" in result) {
    return result.currency;
  }

  return undefined;
}
