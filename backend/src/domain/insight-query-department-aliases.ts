import { INSIGHT_QUERY_DEPARTMENTS, type InsightQueryDepartment } from "@acme/shared";

const DEPARTMENT_ALIASES: Record<string, InsightQueryDepartment> = {
  engineers: "Engineering",
  engineer: "Engineering",
  engineering: "Engineering",
  hr: "HR",
  "human resources": "HR",
  finance: "Finance",
  financial: "Finance",
  sales: "Sales",
  operations: "Operations",
  ops: "Operations",
};

export function extractInsightDepartment(normalizedQuery: string): string | null {
  for (const department of INSIGHT_QUERY_DEPARTMENTS) {
    const pattern = new RegExp(`\\b${department}\\b`, "i");
    if (pattern.test(normalizedQuery)) {
      return department;
    }
  }

  for (const [alias, department] of Object.entries(DEPARTMENT_ALIASES)) {
    const pattern = new RegExp(`\\b${alias.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (pattern.test(normalizedQuery)) {
      return department;
    }
  }

  return null;
}

export function resolveDepartmentFromAlias(phrase: string): string | null {
  const normalized = phrase.trim().toLowerCase();

  for (const department of INSIGHT_QUERY_DEPARTMENTS) {
    if (normalized === department.toLowerCase()) {
      return department;
    }
  }

  for (const [alias, department] of Object.entries(DEPARTMENT_ALIASES)) {
    if (normalized === alias) {
      return department;
    }
  }

  return null;
}
