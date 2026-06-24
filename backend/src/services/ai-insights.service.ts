import { insightQueryRequestSchema, type ParseInsightQueryResponse } from "@acme/shared";

import { parseInsightQuery } from "../domain/parse-insight-query.js";

export class AiInsightsService {
  parseQuery(body: unknown): ParseInsightQueryResponse {
    const { query } = insightQueryRequestSchema.parse(body);
    return parseInsightQuery(query);
  }
}
