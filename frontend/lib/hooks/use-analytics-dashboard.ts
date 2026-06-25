"use client";

import type {
  AnalyticsDepartmentStatisticsResponse,
  AnalyticsSummaryResponse,
  AnalyticsTopEarnersResponse,
} from "@acme/shared";
import { useEffect, useState } from "react";

import {
  fetchAnalyticsCurrencies,
  fetchAnalyticsDashboardMetrics,
} from "@/lib/analytics/fetch-analytics-dashboard";
import { useDisplayCurrency } from "@/lib/hooks/use-display-currency";

type AnalyticsDashboardState = {
  currency: string;
  availableCurrencies: string[];
  exchangeRatesAsOf: string | null;
  summary: AnalyticsSummaryResponse | null;
  departmentStatistics: AnalyticsDepartmentStatisticsResponse | null;
  topEarners: AnalyticsTopEarnersResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  selectCurrency: (currency: string) => void;
};

const ANALYTICS_LOAD_ERROR_MESSAGE = "Unable to load analytics dashboard data.";

export function useAnalyticsDashboard(): AnalyticsDashboardState {
  const { currency, selectCurrency, isReady: isCurrencyReady } = useDisplayCurrency();
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [exchangeRatesAsOf, setExchangeRatesAsOf] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [departmentStatistics, setDepartmentStatistics] =
    useState<AnalyticsDepartmentStatisticsResponse | null>(null);
  const [topEarners, setTopEarners] = useState<AnalyticsTopEarnersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAvailableCurrencies() {
      try {
        const response = await fetchAnalyticsCurrencies();

        if (isCancelled) {
          return;
        }

        setAvailableCurrencies(response.currencies);
        setExchangeRatesAsOf(response.exchangeRatesAsOf);
      } catch {
        if (!isCancelled) {
          setAvailableCurrencies([]);
        }
      }
    }

    void loadAvailableCurrencies();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isCurrencyReady) {
      return;
    }

    let isCancelled = false;

    async function loadDashboardMetrics() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const metrics = await fetchAnalyticsDashboardMetrics(currency);

        if (isCancelled) {
          return;
        }

        setSummary(metrics.summary);
        setDepartmentStatistics(metrics.departmentStatistics);
        setTopEarners(metrics.topEarners);
      } catch {
        if (isCancelled) {
          return;
        }

        setSummary(null);
        setDepartmentStatistics(null);
        setTopEarners(null);
        setErrorMessage(ANALYTICS_LOAD_ERROR_MESSAGE);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardMetrics();

    return () => {
      isCancelled = true;
    };
  }, [currency, isCurrencyReady]);

  return {
    currency,
    availableCurrencies,
    exchangeRatesAsOf,
    summary,
    departmentStatistics,
    topEarners,
    isLoading,
    errorMessage,
    selectCurrency,
  };
}
