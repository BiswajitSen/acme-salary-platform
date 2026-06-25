import type { ParsedInsightQuery } from "@acme/shared";

import {
  extractInsightQueryFilters,
  hasScopedInsightFilters,
} from "./insight-query-spec.js";

export function formatInsightScopeLabel(parsedQuery: ParsedInsightQuery): string {
  const filters = extractInsightQueryFilters(parsedQuery);
  const parts: string[] = [];

  if (filters.department !== null) {
    parts.push(filters.department);
  }

  if (filters.country !== null) {
    parts.push(`employees in ${filters.country}`);
  }

  if (parts.length === 0) {
    return "matching employees";
  }

  return parts.join(" · ");
}

export function hasInsightEmployeeScope(parsedQuery: ParsedInsightQuery): boolean {
  return hasScopedInsightFilters(extractInsightQueryFilters(parsedQuery));
}
