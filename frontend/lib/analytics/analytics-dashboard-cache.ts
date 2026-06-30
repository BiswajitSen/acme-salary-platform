import type { AnalyticsCurrenciesResponse, EmployeeFilterOptions } from "@acme/shared";

import type { AnalyticsDashboardMetrics } from "./fetch-analytics-dashboard";
import type { CompensatedEmployeeRecord } from "./types";

const ANALYTICS_DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

type AnalyticsStaticCacheEntry = {
  currencies: AnalyticsCurrenciesResponse;
  filterOptions: EmployeeFilterOptions;
  fetchedAt: number;
};

type AnalyticsEmployeesCacheEntry = {
  employees: CompensatedEmployeeRecord[];
  fetchedAt: number;
};

type AnalyticsMetricsCacheEntry = {
  metrics: AnalyticsDashboardMetrics;
  fetchedAt: number;
};

let staticCache: AnalyticsStaticCacheEntry | null = null;
const employeesCache = new Map<string, AnalyticsEmployeesCacheEntry>();
const metricsCache = new Map<string, AnalyticsMetricsCacheEntry>();

function isFresh(fetchedAt: number, now = Date.now()): boolean {
  return now - fetchedAt < ANALYTICS_DASHBOARD_CACHE_TTL_MS;
}

export function readAnalyticsStaticCache(now = Date.now()): AnalyticsStaticCacheEntry | null {
  if (!staticCache || !isFresh(staticCache.fetchedAt, now)) {
    return null;
  }

  return staticCache;
}

export function writeAnalyticsStaticCache(
  currencies: AnalyticsCurrenciesResponse,
  filterOptions: EmployeeFilterOptions,
  fetchedAt = Date.now(),
): void {
  staticCache = { currencies, filterOptions, fetchedAt };
}

export function readAnalyticsEmployeesCache(
  currency: string,
  now = Date.now(),
): CompensatedEmployeeRecord[] | null {
  const entry = employeesCache.get(currency);

  if (!entry || !isFresh(entry.fetchedAt, now)) {
    return null;
  }

  return entry.employees;
}

export function writeAnalyticsEmployeesCache(
  currency: string,
  employees: CompensatedEmployeeRecord[],
  fetchedAt = Date.now(),
): void {
  employeesCache.set(currency, { employees, fetchedAt });
}

export function readAnalyticsMetricsCache(
  currency: string,
  now = Date.now(),
): AnalyticsDashboardMetrics | null {
  const entry = metricsCache.get(currency);

  if (!entry || !isFresh(entry.fetchedAt, now)) {
    return null;
  }

  return entry.metrics;
}

export function writeAnalyticsMetricsCache(
  currency: string,
  metrics: AnalyticsDashboardMetrics,
  fetchedAt = Date.now(),
): void {
  metricsCache.set(currency, { metrics, fetchedAt });
}

export function clearAnalyticsDashboardCache(): void {
  staticCache = null;
  employeesCache.clear();
  metricsCache.clear();
}

export function getAnalyticsDashboardCacheTtlMs(): number {
  return ANALYTICS_DASHBOARD_CACHE_TTL_MS;
}
