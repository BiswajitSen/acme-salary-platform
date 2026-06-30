"use client";

import type {
  AnalyticsDepartmentStatisticsResponse,
  AnalyticsSummaryResponse,
  AnalyticsTopEarnersResponse,
  EmployeeFilterOptions,
  ExchangeRatesToUsd,
} from "@acme/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  readAnalyticsEmployeesCache,
  readAnalyticsMetricsCache,
  readAnalyticsStaticCache,
  writeAnalyticsEmployeesCache,
  writeAnalyticsMetricsCache,
  writeAnalyticsStaticCache,
} from "@/lib/analytics/analytics-dashboard-cache";
import {
  buildAnalyticsDashboardView,
} from "@/lib/analytics/build-analytics-dashboard-view";
import {
  fetchAnalyticsCurrencies,
  fetchAnalyticsDashboardMetrics,
} from "@/lib/analytics/fetch-analytics-dashboard";
import { fetchCompensatedEmployees } from "@/lib/analytics/fetch-compensated-employees";
import {
  EMPTY_ANALYTICS_FILTERS,
  type AnalyticsDashboardFilters,
  type AnalyticsDashboardView,
  type CompensatedEmployeeRecord,
} from "@/lib/analytics/types";
import { listEmployeeFilterOptions } from "@/lib/api/employees";
import { useDisplayCurrency } from "@/lib/hooks/use-display-currency";

type AnalyticsDashboardState = {
  currency: string;
  availableCurrencies: string[];
  exchangeRatesAsOf: string | null;
  filterOptions: EmployeeFilterOptions;
  filters: AnalyticsDashboardFilters;
  view: AnalyticsDashboardView | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  selectCurrency: (currency: string) => void;
  setFilter: <K extends keyof AnalyticsDashboardFilters>(
    key: K,
    value: AnalyticsDashboardFilters[K],
  ) => void;
  resetFilters: () => void;
};

const ANALYTICS_LOAD_ERROR_MESSAGE = "Unable to load analytics dashboard data.";

const EMPTY_FILTER_OPTIONS: EmployeeFilterOptions = {
  countries: [],
  departments: [],
  jobTitles: [],
};

type DashboardMetricsState = {
  summary: AnalyticsSummaryResponse | null;
  departmentStatistics: AnalyticsDepartmentStatisticsResponse | null;
  topEarners: AnalyticsTopEarnersResponse | null;
  rawEmployees: CompensatedEmployeeRecord[];
};

const EMPTY_METRICS_STATE: DashboardMetricsState = {
  summary: null,
  departmentStatistics: null,
  topEarners: null,
  rawEmployees: [],
};

function hydrateFromCache(currency: string): {
  hasStatic: boolean;
  hasEmployees: boolean;
  hasMetrics: boolean;
  staticRatesToUsd: ExchangeRatesToUsd | null;
} {
  const staticEntry = readAnalyticsStaticCache();
  const cachedEmployees = readAnalyticsEmployeesCache(currency);
  const cachedMetrics = readAnalyticsMetricsCache(currency);

  return {
    hasStatic: staticEntry !== null,
    hasEmployees: cachedEmployees !== null,
    hasMetrics: cachedMetrics !== null,
    staticRatesToUsd: staticEntry?.currencies.ratesToUsd ?? null,
  };
}

export function useAnalyticsDashboard(): AnalyticsDashboardState {
  const { currency, selectCurrency, isReady: isCurrencyReady } = useDisplayCurrency();
  const initialCache = hydrateFromCache(currency);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(
    () => readAnalyticsStaticCache()?.currencies.currencies ?? [],
  );
  const [ratesToUsd, setRatesToUsd] = useState<ExchangeRatesToUsd | null>(
    () => readAnalyticsStaticCache()?.currencies.ratesToUsd ?? null,
  );
  const [exchangeRatesAsOf, setExchangeRatesAsOf] = useState<string | null>(
    () => readAnalyticsStaticCache()?.currencies.exchangeRatesAsOf ?? null,
  );
  const [filterOptions, setFilterOptions] = useState<EmployeeFilterOptions>(
    () => readAnalyticsStaticCache()?.filterOptions ?? EMPTY_FILTER_OPTIONS,
  );
  const [filters, setFilters] = useState<AnalyticsDashboardFilters>(EMPTY_ANALYTICS_FILTERS);
  const [metricsState, setMetricsState] = useState<DashboardMetricsState>(() => {
    const cachedMetrics = readAnalyticsMetricsCache(currency);
    const cachedEmployees = readAnalyticsEmployeesCache(currency) ?? [];

    return cachedMetrics
      ? {
          summary: cachedMetrics.summary,
          departmentStatistics: cachedMetrics.departmentStatistics,
          topEarners: cachedMetrics.topEarners,
          rawEmployees: cachedEmployees,
        }
      : EMPTY_METRICS_STATE;
  });
  const [isLoading, setIsLoading] = useState(
    () => !(initialCache.hasStatic && initialCache.hasEmployees && initialCache.hasMetrics),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metricsCurrency, setMetricsCurrency] = useState(currency);

  if (isCurrencyReady && ratesToUsd !== null && currency !== metricsCurrency) {
    const cachedEmployees = readAnalyticsEmployeesCache(currency);
    const cachedMetrics = readAnalyticsMetricsCache(currency);

    setMetricsCurrency(currency);

    if (cachedEmployees !== null && cachedMetrics !== null) {
      setMetricsState({
        summary: cachedMetrics.summary,
        departmentStatistics: cachedMetrics.departmentStatistics,
        topEarners: cachedMetrics.topEarners,
        rawEmployees: cachedEmployees,
      });
      setIsLoading(false);
      setErrorMessage(null);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadStaticData() {
      const cached = readAnalyticsStaticCache();

      if (cached) {
        setAvailableCurrencies(cached.currencies.currencies);
        setExchangeRatesAsOf(cached.currencies.exchangeRatesAsOf);
        setRatesToUsd(cached.currencies.ratesToUsd);
        setFilterOptions(cached.filterOptions);
      }

      if (cached) {
        return;
      }

      try {
        const [currenciesResponse, options] = await Promise.all([
          fetchAnalyticsCurrencies(),
          listEmployeeFilterOptions(),
        ]);

        if (isCancelled) {
          return;
        }

        writeAnalyticsStaticCache(currenciesResponse, options);
        setAvailableCurrencies(currenciesResponse.currencies);
        setExchangeRatesAsOf(currenciesResponse.exchangeRatesAsOf);
        setRatesToUsd(currenciesResponse.ratesToUsd);
        setFilterOptions(options);
      } catch {
        if (!isCancelled) {
          setAvailableCurrencies([]);
        }
      }
    }

    void loadStaticData();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isCurrencyReady || ratesToUsd === null) {
      return;
    }

    let isCancelled = false;
    const cachedEmployees = readAnalyticsEmployeesCache(currency);
    const cachedMetrics = readAnalyticsMetricsCache(currency);

    if (cachedEmployees !== null && cachedMetrics !== null) {
      return;
    }

    async function loadDashboardMetrics() {
      const hasPartialCache = cachedEmployees !== null || cachedMetrics !== null;
      setIsLoading(!hasPartialCache);
      setIsRefreshing(hasPartialCache);
      setErrorMessage(null);

      try {
        const employeesPromise = cachedEmployees
          ? Promise.resolve(cachedEmployees)
          : fetchCompensatedEmployees(currency);
        const metricsPromise = cachedMetrics
          ? Promise.resolve(cachedMetrics)
          : fetchAnalyticsDashboardMetrics(currency);

        const [employees, metrics] = await Promise.all([employeesPromise, metricsPromise]);

        if (isCancelled) {
          return;
        }

        writeAnalyticsEmployeesCache(currency, employees);
        writeAnalyticsMetricsCache(currency, metrics);
        setMetricsState({
          summary: metrics.summary,
          departmentStatistics: metrics.departmentStatistics,
          topEarners: metrics.topEarners,
          rawEmployees: employees,
        });
      } catch {
        if (isCancelled) {
          return;
        }

        setMetricsState(EMPTY_METRICS_STATE);
        setErrorMessage(ANALYTICS_LOAD_ERROR_MESSAGE);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadDashboardMetrics();

    return () => {
      isCancelled = true;
    };
  }, [currency, isCurrencyReady, ratesToUsd]);

  const compensatedEmployees = metricsState.rawEmployees;

  const view = useMemo(() => {
    if (!exchangeRatesAsOf || ratesToUsd === null) {
      return null;
    }

    if (
      !metricsState.summary &&
      !metricsState.departmentStatistics &&
      !metricsState.topEarners &&
      compensatedEmployees.length === 0
    ) {
      return null;
    }

    return buildAnalyticsDashboardView({
      currency,
      exchangeRatesAsOf,
      filters,
      ratesToUsd,
      employees: compensatedEmployees,
      apiSummary: metricsState.summary,
      apiDepartments: metricsState.departmentStatistics,
      apiTopEarners: metricsState.topEarners,
    });
  }, [
    compensatedEmployees,
    currency,
    exchangeRatesAsOf,
    filters,
    metricsState.departmentStatistics,
    metricsState.summary,
    metricsState.topEarners,
    ratesToUsd,
  ]);

  const setFilter = useCallback(
    <K extends keyof AnalyticsDashboardFilters>(
      key: K,
      value: AnalyticsDashboardFilters[K],
    ) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_ANALYTICS_FILTERS);
  }, []);

  return {
    currency,
    availableCurrencies,
    exchangeRatesAsOf,
    filterOptions,
    filters,
    view,
    isLoading,
    isRefreshing,
    errorMessage,
    selectCurrency,
    setFilter,
    resetFilters,
  };
}
