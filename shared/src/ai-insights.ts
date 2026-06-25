import { z } from "zod";

import type { CompensationReason } from "./compensation";
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
  "BOTTOM_EARNERS",
  "NEAR_MEDIAN_EARNERS",
  "MEDIAN_SPLIT_COUNTS",
  "RECENT_PROMOTIONS",
  "RECENT_NEW_HIRES",
  "RECENT_SALARY_INCREASES",
  "UNKNOWN",
] as const;

export const DEFAULT_INSIGHT_NEAR_MEDIAN_TOLERANCE_PERCENT = 10;

export const DEFAULT_INSIGHT_TIMELINE_MONTHS = 3;

/** @deprecated Use DEFAULT_INSIGHT_TIMELINE_MONTHS */
export const DEFAULT_RECENT_PROMOTIONS_MONTHS = DEFAULT_INSIGHT_TIMELINE_MONTHS;

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

export const insightScopeQuerySchema = z.object({
  country: z.enum(INSIGHT_QUERY_COUNTRIES).optional(),
  department: z.enum(INSIGHT_QUERY_DEPARTMENTS).optional(),
  jobTitle: z.string().trim().min(1).max(100).optional(),
  limit: z.number().int().positive().max(25).optional(),
});

export const insightAnalyticsQuerySchema = insightScopeQuerySchema.extend({
  currency: analyticsDisplayCurrencySchema,
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
  jobTitle: string | null;
  currency: string | null;
  months: number | null;
  sinceDate: string | null;
  limit: number | null;
};

export type InsightScopedResultFields = {
  country: string | null;
  department: string | null;
  jobTitle: string | null;
};

export type InsightTimelineEvent = {
  employeeId: string;
  fullName: string;
  department: string;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: CompensationReason;
};

/** @deprecated Use InsightTimelineEvent */
export type PromotedEmployee = InsightTimelineEvent;

export type InsightTimelineResultBase = {
  months: number;
  country: string | null;
  department: string | null;
  events: InsightTimelineEvent[];
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

export type InsightAvgDeptSalaryResult = InsightScopedResultFields & {
  intent: "AVG_DEPT_SALARY";
  currency: string;
  averageSalary: number;
  employeeCount: number;
};

export type InsightMedianDeptSalaryResult = InsightScopedResultFields & {
  intent: "MEDIAN_DEPT_SALARY";
  currency: string;
  medianSalary: number;
  employeeCount: number;
};

export type InsightHeadcountResult = InsightScopedResultFields & {
  intent: "HEADCOUNT";
  currency: string;
  headcount: number;
};

export type InsightTotalPayrollResult = InsightScopedResultFields & {
  intent: "TOTAL_PAYROLL";
  currency: string;
  totalPayroll: number;
};

export type InsightTopEarnersResult = InsightScopedResultFields & {
  intent: "TOP_EARNERS";
  currency: string;
  limit: number;
  earners: TopEarner[];
};

export type InsightBottomEarnersResult = InsightScopedResultFields & {
  intent: "BOTTOM_EARNERS";
  currency: string;
  limit: number;
  earners: TopEarner[];
};

export type InsightNearMedianEarnersResult = InsightScopedResultFields & {
  intent: "NEAR_MEDIAN_EARNERS";
  currency: string;
  medianSalary: number;
  tolerancePercent: number;
  earners: TopEarner[];
};

export type InsightMedianSplitCountsResult = InsightScopedResultFields & {
  intent: "MEDIAN_SPLIT_COUNTS";
  currency: string;
  medianSalary: number;
  belowMedianCount: number;
  aboveMedianCount: number;
  employeeCount: number;
};

export type InsightTimelineResultScope = InsightScopedResultFields & {
  months: number | null;
  sinceDate: string | null;
};

export type InsightRecentPromotionsResult = InsightTimelineResultScope & {
  intent: "RECENT_PROMOTIONS";
  promotions: InsightTimelineEvent[];
};

export type InsightRecentNewHiresResult = InsightTimelineResultScope & {
  intent: "RECENT_NEW_HIRES";
  hires: InsightTimelineEvent[];
};

export type InsightRecentSalaryIncreasesResult = InsightTimelineResultScope & {
  intent: "RECENT_SALARY_INCREASES";
  increases: InsightTimelineEvent[];
};

export type InsightExecutionResult =
  | InsightAvgDeptSalaryResult
  | InsightMedianDeptSalaryResult
  | InsightHeadcountResult
  | InsightTotalPayrollResult
  | InsightTopEarnersResult
  | InsightBottomEarnersResult
  | InsightNearMedianEarnersResult
  | InsightMedianSplitCountsResult
  | InsightRecentPromotionsResult
  | InsightRecentNewHiresResult
  | InsightRecentSalaryIncreasesResult;

export type ExecuteInsightQueryResponse = {
  parsedQuery: ParsedInsightQuery;
  result: InsightExecutionResult | null;
  error: InsightExecutionError | null;
  exchangeRatesAsOf: string;
};
