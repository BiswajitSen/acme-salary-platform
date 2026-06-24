import { z } from "zod";

export const AI_INSIGHT_INTENTS = [
  "AVG_DEPT_SALARY",
  "MEDIAN_DEPT_SALARY",
  "HEADCOUNT",
  "TOTAL_PAYROLL",
  "TOP_EARNERS",
  "UNKNOWN",
] as const;

export type AiInsightIntent = (typeof AI_INSIGHT_INTENTS)[number];

export const INSIGHT_QUERY_DEPARTMENTS = [
  "Engineering",
  "HR",
  "Finance",
  "Sales",
  "Operations",
] as const;

export type InsightQueryDepartment = (typeof INSIGHT_QUERY_DEPARTMENTS)[number];

export const insightQueryRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Query is required")
    .max(500, "Query must be 500 characters or fewer"),
});

export type InsightQueryRequest = z.infer<typeof insightQueryRequestSchema>;

export type ParsedInsightQuery = {
  intent: AiInsightIntent;
  originalQuery: string;
  department: string | null;
  currency: string | null;
};

export type ParseInsightQueryResponse = ParsedInsightQuery;
