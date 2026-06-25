import {
  insightQueryRequestSchema,
  type ExecuteInsightQueryResponse,
  type ParseInsightQueryResponse,
} from "@acme/shared";

import { executeParsedInsightQuery } from "../domain/execute-insight-query.js";
import { parseInsightQuery } from "../domain/parse-insight-query.js";
import { resolveInsightExecutionCurrency } from "../domain/resolve-insight-execution-currency.js";
import type { InsightAnalyticsService } from "./insight-analytics.service.js";

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
      getAnalyticsSummary: (currency, country, department) =>
        this.insightAnalyticsService.getAnalyticsSummary({
          currency,
          ...(country === null ? {} : { country }),
          ...(department === null ? {} : { department }),
        }),
      getScopedSalaryStatistics: (currency, country, department) =>
        this.insightAnalyticsService.getScopedSalaryStatistics({
          currency,
          ...(country === null ? {} : { country }),
          ...(department === null ? {} : { department }),
        }),
      getTopEarners: (currency, country, department) =>
        this.insightAnalyticsService.getTopEarners({
          currency,
          ...(country === null ? {} : { country }),
          ...(department === null ? {} : { department }),
        }),
      getRecentPromotions: (months, country, department) =>
        this.insightAnalyticsService.getRecentPromotions({
          months,
          ...(country === null ? {} : { country }),
          ...(department === null ? {} : { department }),
        }),
    });

    return {
      ...execution,
      parsedQuery,
      exchangeRatesAsOf,
    };
  }
}
