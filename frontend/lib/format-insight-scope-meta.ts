type InsightScopeParts = {
  department?: string | null;
  country?: string | null;
  jobTitle?: string | null;
  currency: string;
};

function buildScopeParts({ department, country, jobTitle }: InsightScopeParts): string[] {
  const parts: string[] = [];

  if (department) {
    parts.push(department);
  }

  if (jobTitle) {
    parts.push(jobTitle);
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

export function formatInsightTopEarnersScopeMeta(
  scope: InsightScopeParts & { limit?: number },
): string {
  const parts = buildScopeParts(scope);
  const limitLabel = scope.limit ? `Top ${scope.limit}` : "Top earners";

  if (parts.length === 0) {
    return `${limitLabel} · amounts in ${scope.currency}`;
  }

  return `${limitLabel} · ${parts.join(" · ")} · amounts in ${scope.currency}`;
}

export function formatInsightBottomEarnersScopeMeta(
  scope: InsightScopeParts & { limit?: number },
): string {
  const parts = buildScopeParts(scope);
  const limitLabel = scope.limit ? `Bottom ${scope.limit}` : "Bottom earners";

  if (parts.length === 0) {
    return `${limitLabel} · amounts in ${scope.currency}`;
  }

  return `${limitLabel} · ${parts.join(" · ")} · amounts in ${scope.currency}`;
}

export function formatInsightNearMedianScopeMeta(
  scope: InsightScopeParts & { tolerancePercent: number },
): string {
  const parts = buildScopeParts(scope);
  const band = `Within ±${scope.tolerancePercent}% of median`;

  if (parts.length === 0) {
    return `${band} · amounts in ${scope.currency}`;
  }

  return `${band} · ${parts.join(" · ")} · amounts in ${scope.currency}`;
}

export function formatInsightTimelineScopeMeta(scope: {
  months: number | null;
  sinceDate?: string | null;
  country?: string | null;
  department?: string | null;
  jobTitle?: string | null;
}): string {
  const parts = buildScopeParts(scope);
  const timeline =
    scope.sinceDate !== null && scope.sinceDate !== undefined
      ? `Since ${scope.sinceDate}`
      : scope.months !== null
        ? `Last ${scope.months} months`
        : "Recent period";

  if (parts.length === 0) {
    return timeline;
  }

  return `${timeline} · ${parts.join(" · ")}`;
}
