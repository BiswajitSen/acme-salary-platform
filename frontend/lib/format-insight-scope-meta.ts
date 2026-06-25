import type { ParsedInsightQuery } from "@acme/shared";

type InsightScopeParts = {
  department?: string | null;
  country?: string | null;
  currency: string;
};

function buildScopeParts({ department, country }: InsightScopeParts): string[] {
  const parts: string[] = [];

  if (department) {
    parts.push(department);
  }

  if (country) {
    parts.push(`employees in ${country}`);
  }

  return parts;
}

export function formatInsightPayrollScopeMeta(scope: InsightScopeParts): string {
  const parts = buildScopeParts(scope);

  if (parts.length === 0) {
    return `Organization-wide · converted to ${scope.currency}`;
  }

  return `${parts.join(" · ")} · converted to ${scope.currency}`;
}

export function formatInsightHeadcountScopeMeta(scope: InsightScopeParts): string {
  const parts = buildScopeParts(scope);

  if (parts.length === 0) {
    return "Organization-wide headcount";
  }

  return `${parts.join(" · ")} · with compensation records`;
}

export function formatInsightSalaryScopeMeta(
  scope: InsightScopeParts & { employeeCount: number },
): string {
  const parts = buildScopeParts(scope);

  if (parts.length === 0) {
    return `${scope.employeeCount} employees · ${scope.currency}`;
  }

  return `${parts.join(" · ")} · ${scope.employeeCount} employees · ${scope.currency}`;
}
