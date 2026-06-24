import { z } from "zod";

import type { TopEarner } from "./analytics";

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

export const DEFAULT_INSIGHT_CURRENCY = "USD";

export const INSIGHT_EXECUTION_ERROR_KINDS = [
  "UNSUPPORTED_INTENT",
  "DEPARTMENT_NOT_FOUND",
  "REJECTED_INPUT",
] as const;

export type InsightExecutionErrorKind = (typeof INSIGHT_EXECUTION_ERROR_KINDS)[number];

export type InsightExecutionError = {
  kind: InsightExecutionErrorKind;
  message: string;
};

export type InsightAvgDeptSalaryResult = {
  intent: "AVG_DEPT_SALARY";
  currency: string;
  department: string;
  averageSalary: number;
  employeeCount: number;
};

export type InsightMedianDeptSalaryResult = {
  intent: "MEDIAN_DEPT_SALARY";
  currency: string;
  department: string;
  medianSalary: number;
  employeeCount: number;
};

export type InsightHeadcountResult = {
  intent: "HEADCOUNT";
  currency: string;
  headcount: number;
};

export type InsightTotalPayrollResult = {
  intent: "TOTAL_PAYROLL";
  currency: string;
  totalPayroll: number;
};

export type InsightTopEarnersResult = {
  intent: "TOP_EARNERS";
  currency: string;
  earners: TopEarner[];
};

export type InsightExecutionResult =
  | InsightAvgDeptSalaryResult
  | InsightMedianDeptSalaryResult
  | InsightHeadcountResult
  | InsightTotalPayrollResult
  | InsightTopEarnersResult;

export type ExecuteInsightQueryResponse = {
  parsedQuery: ParsedInsightQuery;
  result: InsightExecutionResult | null;
  error: InsightExecutionError | null;
};
