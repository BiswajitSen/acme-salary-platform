import { insightAnalyticsQuerySchema } from "@acme/shared";

export function parseInsightAnalyticsQuery(query: unknown) {
  return insightAnalyticsQuerySchema.parse(query);
}

export function parseInsightTopEarnersQuery(query: unknown) {
  return parseInsightAnalyticsQuery(query);
}
