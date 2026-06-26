import type {
  AnalyticsCompensatedEmployeesResponse,
  AnalyticsCurrenciesResponse,
  AnalyticsDepartmentStatisticsResponse,
  AnalyticsSummaryResponse,
  AnalyticsTopEarnersResponse,
} from "@acme/shared";

import { apiFetch } from "./client";

function buildAnalyticsQuery(currency: string): string {
  return `?currency=${encodeURIComponent(currency)}`;
}

export async function getAnalyticsCurrencies(): Promise<AnalyticsCurrenciesResponse> {
  return apiFetch<AnalyticsCurrenciesResponse>("/api/backend/analytics/currencies");
}

export async function getAnalyticsSummary(
  currency: string,
): Promise<AnalyticsSummaryResponse> {
  return apiFetch<AnalyticsSummaryResponse>(
    `/api/backend/analytics/summary${buildAnalyticsQuery(currency)}`,
  );
}

export async function getDepartmentSalaryStatistics(
  currency: string,
): Promise<AnalyticsDepartmentStatisticsResponse> {
  return apiFetch<AnalyticsDepartmentStatisticsResponse>(
    `/api/backend/analytics/departments${buildAnalyticsQuery(currency)}`,
  );
}

export async function getTopEarners(
  currency: string,
): Promise<AnalyticsTopEarnersResponse> {
  return apiFetch<AnalyticsTopEarnersResponse>(
    `/api/backend/analytics/top-earners${buildAnalyticsQuery(currency)}`,
  );
}

export async function getAnalyticsCompensatedEmployees(
  currency: string,
): Promise<AnalyticsCompensatedEmployeesResponse> {
  return apiFetch<AnalyticsCompensatedEmployeesResponse>(
    `/api/backend/analytics/compensated-employees${buildAnalyticsQuery(currency)}`,
  );
}
