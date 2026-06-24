import {
  insightQueryRequestSchema,
  type ExecuteInsightQueryResponse,
  type ParseInsightQueryResponse,
} from "@acme/shared";

import { executeParsedInsightQuery } from "../domain/execute-insight-query.js";
import { parseInsightQuery } from "../domain/parse-insight-query.js";
import type { AnalyticsService } from "./analytics.service.js";

export class AiInsightsService {
  constructor(private readonly analyticsService: AnalyticsService) {}

  parseQuery(body: unknown): ParseInsightQueryResponse {
    const { query } = insightQueryRequestSchema.parse(body);
    return parseInsightQuery(query);
  }

  async executeQuery(body: unknown): Promise<ExecuteInsightQueryResponse> {
    const parsedQuery = this.parseQuery(body);

    return executeParsedInsightQuery(parsedQuery, {
      getAnalyticsSummary: (currency) =>
        this.analyticsService.getAnalyticsSummary({ currency }),
      getDepartmentSalaryStatistics: (currency) =>
        this.analyticsService.getDepartmentSalaryStatistics({ currency }),
      getTopEarners: (currency) => this.analyticsService.getTopEarners({ currency }),
    });
  }
}
