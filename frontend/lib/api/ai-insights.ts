import type { ExecuteInsightQueryResponse } from "@acme/shared";

import { apiPostJson } from "./client";

export async function parseInsightQuery(
  query: string,
): Promise<ExecuteInsightQueryResponse["parsedQuery"]> {
  return apiPostJson<ExecuteInsightQueryResponse["parsedQuery"]>("/api/backend/insights/parse", {
    query,
  });
}

export async function executeInsightQuery(
  query: string,
): Promise<ExecuteInsightQueryResponse> {
  return apiPostJson<ExecuteInsightQueryResponse>("/api/backend/insights/execute", { query });
}
