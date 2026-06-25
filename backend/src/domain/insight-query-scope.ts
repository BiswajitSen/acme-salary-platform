import type { ParsedInsightQuery } from "@acme/shared";

export function formatInsightScopeLabel(parsedQuery: ParsedInsightQuery): string {
  const parts: string[] = [];

  if (parsedQuery.department !== null) {
    parts.push(parsedQuery.department);
  }

  if (parsedQuery.country !== null) {
    parts.push(`employees in ${parsedQuery.country}`);
  }

  if (parts.length === 0) {
    return "matching employees";
  }

  return parts.join(" · ");
}

export function hasInsightEmployeeScope(parsedQuery: ParsedInsightQuery): boolean {
  return parsedQuery.department !== null || parsedQuery.country !== null;
}
