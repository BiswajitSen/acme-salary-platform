import { z } from "zod";

import type { TopEarner } from "./analytics";

import {
  analyticsDisplayCurrencySchema,
  DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
} from "./currency-conversion";

export const AI_INSIGHT_INTENTS = [
  "AVG_DEPT_SALARY",
  "MEDIAN_DEPT_SALARY",
  "HEADCOUNT",
  "TOTAL_PAYROLL",
  "TOP_EARNERS",
  "RECENT_PROMOTIONS",
  "UNKNOWN",
] as const;

export const DEFAULT_RECENT_PROMOTIONS_MONTHS = 3;

export type AiInsightIntent = (typeof AI_INSIGHT_INTENTS)[number];

export const INSIGHT_QUERY_DEPARTMENTS = [
  "Engineering",
  "HR",
  "Finance",
  "Sales",
  "Operations",
] as const;

export type InsightQueryDepartment = (typeof INSIGHT_QUERY_DEPARTMENTS)[number];

export const INSIGHT_QUERY_COUNTRIES = ["US", "UK", "SG", "DE", "IN"] as const;

export type InsightQueryCountry = (typeof INSIGHT_QUERY_COUNTRIES)[number];

export const insightQueryRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Query is required")
    .max(500, "Query must be 500 characters or fewer"),
  displayCurrency: analyticsDisplayCurrencySchema.optional(),
});

export const insightAnalyticsQuerySchema = z.object({
  currency: analyticsDisplayCurrencySchema,
  country: z.enum(INSIGHT_QUERY_COUNTRIES).optional(),
  department: z.enum(INSIGHT_QUERY_DEPARTMENTS).optional(),
});

export type InsightAnalyticsQuery = z.infer<typeof insightAnalyticsQuerySchema>;

/** @deprecated Use insightAnalyticsQuerySchema */
export const insightTopEarnersQuerySchema = insightAnalyticsQuerySchema;

export type InsightTopEarnersQuery = InsightAnalyticsQuery;

export type InsightQueryRequest = z.infer<typeof insightQueryRequestSchema>;

export type ParsedInsightQuery = {
  intent: AiInsightIntent;
  originalQuery: string;
  department: string | null;
  country: string | null;
  currency: string | null;
  months: number | null;
};

export type PromotedEmployee = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
};

export type ParseInsightQueryResponse = ParsedInsightQuery;

export const DEFAULT_INSIGHT_CURRENCY = DEFAULT_ANALYTICS_DISPLAY_CURRENCY;

export const INSIGHT_EXECUTION_ERROR_KINDS = [
  "UNSUPPORTED_INTENT",
  "DEPARTMENT_NOT_FOUND",
  "COUNTRY_NOT_FOUND",
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
  country: string | null;
  department: string | null;
  averageSalary: number;
  employeeCount: number;
};

export type InsightMedianDeptSalaryResult = {
  intent: "MEDIAN_DEPT_SALARY";
  currency: string;
  country: string | null;
  department: string | null;
  medianSalary: number;
  employeeCount: number;
};

export type InsightHeadcountResult = {
  intent: "HEADCOUNT";
  currency: string;
  country: string | null;
  department: string | null;
  headcount: number;
};

export type InsightTotalPayrollResult = {
  intent: "TOTAL_PAYROLL";
  currency: string;
  country: string | null;
  department: string | null;
  totalPayroll: number;
};

export type InsightTopEarnersResult = {
  intent: "TOP_EARNERS";
  currency: string;
  country: string | null;
  department: string | null;
  earners: TopEarner[];
};

export type InsightRecentPromotionsResult = {
  intent: "RECENT_PROMOTIONS";
  months: number;
  country: string | null;
  department: string | null;
  promotions: PromotedEmployee[];
};

export type InsightExecutionResult =
  | InsightAvgDeptSalaryResult
  | InsightMedianDeptSalaryResult
  | InsightHeadcountResult
  | InsightTotalPayrollResult
  | InsightTopEarnersResult
  | InsightRecentPromotionsResult;

export type ExecuteInsightQueryResponse = {
  parsedQuery: ParsedInsightQuery;
  result: InsightExecutionResult | null;
  error: InsightExecutionError | null;
  exchangeRatesAsOf: string;
};
