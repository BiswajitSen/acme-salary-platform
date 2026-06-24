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

type AnalyticsDashboardState = {
  currency: string;
  availableCurrencies: string[];
  summary: AnalyticsSummaryResponse | null;
  departmentStatistics: AnalyticsDepartmentStatisticsResponse | null;
  topEarners: AnalyticsTopEarnersResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  selectCurrency: (currency: string) => void;
};

const ANALYTICS_LOAD_ERROR_MESSAGE = "Unable to load analytics dashboard data.";

export function useAnalyticsDashboard(
  initialCurrency = "USD",
): AnalyticsDashboardState {
  const [currency, setCurrency] = useState(initialCurrency);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
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
        const currencies = await fetchAnalyticsCurrencies();

        if (isCancelled) {
          return;
        }

        setAvailableCurrencies(currencies);

        if (currencies.length > 0 && !currencies.includes(currency)) {
          setCurrency(currencies[0]!);
        }
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
  }, [currency]);

  function selectCurrency(nextCurrency: string) {
    setCurrency(nextCurrency.toUpperCase());
  }

  return {
    currency,
    availableCurrencies,
    summary,
    departmentStatistics,
    topEarners,
    isLoading,
    errorMessage,
    selectCurrency,
  };
}
