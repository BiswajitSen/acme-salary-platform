import type {
  AnalyticsDepartmentStatisticsResponse,
  AnalyticsSummaryResponse,
  AnalyticsTopEarnersResponse,
} from "@acme/shared";

import {
  getAnalyticsCurrencies,
  getAnalyticsSummary,
  getDepartmentSalaryStatistics,
  getTopEarners,
} from "@/lib/api/analytics";

export type AnalyticsDashboardMetrics = {
  summary: AnalyticsSummaryResponse;
  departmentStatistics: AnalyticsDepartmentStatisticsResponse;
  topEarners: AnalyticsTopEarnersResponse;
};

export async function fetchAnalyticsCurrencies(): Promise<string[]> {
  const response = await getAnalyticsCurrencies();
  return response.currencies;
}

export async function fetchAnalyticsDashboardMetrics(
  currency: string,
): Promise<AnalyticsDashboardMetrics> {
  const [summary, departmentStatistics, topEarners] = await Promise.all([
    getAnalyticsSummary(currency),
    getDepartmentSalaryStatistics(currency),
    getTopEarners(currency),
  ]);

  return { summary, departmentStatistics, topEarners };
}
