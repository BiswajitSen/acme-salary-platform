import {
  insightQueryRequestSchema,
  type ExecuteInsightQueryResponse,
  type ParseInsightQueryResponse,
} from "@acme/shared";

import { executeParsedInsightQuery } from "../domain/execute-insight-query.js";
import { parseInsightQuery } from "../domain/parse-insight-query.js";
import { resolveInsightExecutionCurrency } from "../domain/resolve-insight-execution-currency.js";
import type { InsightAnalyticsService } from "./insight-analytics.service.js";

function buildScopeQuery(
  scope: {
    country?: string;
    department?: string;
    jobTitle?: string;
  },
) {
  return {
    ...(scope.country === undefined ? {} : { country: scope.country }),
    ...(scope.department === undefined ? {} : { department: scope.department }),
    ...(scope.jobTitle === undefined ? {} : { jobTitle: scope.jobTitle }),
  };
}

export class AiInsightsService {
  constructor(private readonly insightAnalyticsService: InsightAnalyticsService) {}

  parseQuery(body: unknown): ParseInsightQueryResponse {
    const { query } = insightQueryRequestSchema.parse(body);
    return parseInsightQuery(query);
  }

  async executeQuery(body: unknown): Promise<ExecuteInsightQueryResponse> {
    const { query, displayCurrency } = insightQueryRequestSchema.parse(body);
    const parsedQuery = parseInsightQuery(query);
    const executionCurrency = resolveInsightExecutionCurrency(parsedQuery, displayCurrency);
    const executionQuery = { ...parsedQuery, currency: executionCurrency };
    const exchangeRatesAsOf = await this.insightAnalyticsService.getExchangeRatesAsOf();
    const execution = await executeParsedInsightQuery(executionQuery, {
      getAnalyticsSummary: (currency, scope) =>
        this.insightAnalyticsService.getAnalyticsSummary({
          currency,
          ...buildScopeQuery(scope),
        }),
      getScopedSalaryStatistics: (currency, scope) =>
        this.insightAnalyticsService.getScopedSalaryStatistics({
          currency,
          ...buildScopeQuery(scope),
        }),
      getTopEarners: (currency, scope, limit) =>
        this.insightAnalyticsService.getTopEarners({
          currency,
          ...buildScopeQuery(scope),
          limit,
        }),
      getBottomEarners: (currency, scope, limit) =>
        this.insightAnalyticsService.getBottomEarners({
          currency,
          ...buildScopeQuery(scope),
          limit,
        }),
      getNearMedianEarners: (currency, scope, tolerancePercent) =>
        this.insightAnalyticsService.getNearMedianEarners({
          currency,
          ...buildScopeQuery(scope),
          tolerancePercent,
        }),
      getRecentTimelineEvents: (intent, query) =>
        this.insightAnalyticsService.getRecentTimelineEvents(intent, {
          ...(query.months === null ? {} : { months: query.months }),
          ...(query.sinceDate === null ? {} : { sinceDate: query.sinceDate }),
          ...(query.country === null ? {} : { country: query.country }),
          ...(query.department === null ? {} : { department: query.department }),
          ...(query.jobTitle === null ? {} : { jobTitle: query.jobTitle }),
          reasons: query.reasons,
        }),
    });

    return {
      ...execution,
      parsedQuery,
      exchangeRatesAsOf,
    };
  }
}
