"use client";

import type {
  AnalyticsDepartmentStatisticsResponse,
  AnalyticsSummaryResponse,
  AnalyticsTopEarnersResponse,
} from "@acme/shared";
import { useEffect, useState } from "react";

import {
  getAnalyticsSummary,
  getDepartmentSalaryStatistics,
  getTopEarners,
} from "@/lib/api/analytics";

type AnalyticsDashboardState = {
  currency: string;
  summary: AnalyticsSummaryResponse | null;
  departmentStatistics: AnalyticsDepartmentStatisticsResponse | null;
  topEarners: AnalyticsTopEarnersResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  selectCurrency: (currency: string) => void;
};

export function useAnalyticsDashboard(
  initialCurrency = "USD",
): AnalyticsDashboardState {
  const [currency, setCurrency] = useState(initialCurrency);
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [departmentStatistics, setDepartmentStatistics] =
    useState<AnalyticsDepartmentStatisticsResponse | null>(null);
  const [topEarners, setTopEarners] = useState<AnalyticsTopEarnersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAnalyticsDashboard() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [nextSummary, nextDepartmentStatistics, nextTopEarners] = await Promise.all([
          getAnalyticsSummary(currency),
          getDepartmentSalaryStatistics(currency),
          getTopEarners(currency),
        ]);

        if (isCancelled) {
          return;
        }

        setSummary(nextSummary);
        setDepartmentStatistics(nextDepartmentStatistics);
        setTopEarners(nextTopEarners);
      } catch {
        if (isCancelled) {
          return;
        }

        setSummary(null);
        setDepartmentStatistics(null);
        setTopEarners(null);
        setErrorMessage("Unable to load analytics dashboard data.");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalyticsDashboard();

    return () => {
      isCancelled = true;
    };
  }, [currency]);

  function selectCurrency(nextCurrency: string) {
    setCurrency(nextCurrency.toUpperCase());
  }

  return {
    currency,
    summary,
    departmentStatistics,
    topEarners,
    isLoading,
    errorMessage,
    selectCurrency,
  };
}
