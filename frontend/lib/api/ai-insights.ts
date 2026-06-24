import type { ParseInsightQueryResponse } from "@acme/shared";

import { apiPostJson } from "./client";

export async function parseInsightQuery(query: string): Promise<ParseInsightQueryResponse> {
  return apiPostJson<ParseInsightQueryResponse>("/api/backend/insights/parse", { query });
}
