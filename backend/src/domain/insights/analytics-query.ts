import { z } from "zod";

import { insightAnalyticsQuerySchema, insightScopeQuerySchema } from "@acme/shared";

import type { EmployeeScopeParams } from "./employee-scope.js";

const insightTimelineQuerySchema = insightScopeQuerySchema.extend({
  months: z.number().int().positive().optional(),
  sinceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export function parseInsightAnalyticsQuery(query: unknown) {
  return insightAnalyticsQuerySchema.parse(query);
}

export function parseInsightTimelineQuery(query: unknown) {
  return insightTimelineQuerySchema.parse(query);
}

export function toEmployeeScopeFromQuery(
  query: {
    country?: string;
    department?: string;
    jobTitle?: string;
  },
): EmployeeScopeParams {
  return {
    ...(query.country === undefined ? {} : { country: query.country }),
    ...(query.department === undefined ? {} : { department: query.department }),
    ...(query.jobTitle === undefined ? {} : { jobTitle: query.jobTitle }),
  };
}

export function parseInsightTopEarnersQuery(query: unknown) {
  return parseInsightAnalyticsQuery(query);
}
