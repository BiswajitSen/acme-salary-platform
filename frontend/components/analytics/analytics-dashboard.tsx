"use client";

import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatusMessage } from "@/components/ui/status-message";
import { AnalyticsDepartmentTable } from "@/components/analytics/analytics-department-table";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { AnalyticsTopEarnersList } from "@/components/analytics/analytics-top-earners-list";
import { useAnalyticsDashboard } from "@/lib/hooks/use-analytics-dashboard";

import styles from "./analytics-dashboard.module.css";

export function AnalyticsDashboard() {
  const {
    currency,
    availableCurrencies,
    summary,
    departmentStatistics,
    topEarners,
    isLoading,
    errorMessage,
    selectCurrency,
  } = useAnalyticsDashboard();

  const hasData = summary !== null && departmentStatistics !== null && topEarners !== null;
  const hasCurrencies = availableCurrencies.length > 0;

  return (
    <section className={styles.page}>
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Leadership metrics converted to a display currency for org-wide comparison"
        actions={
          hasCurrencies ? (
            <Select
              id="analytics-currency"
              label="Display currency"
              value={currency}
              onChange={(event) => selectCurrency(event.target.value)}
            >
              {availableCurrencies.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {isLoading && <StatusMessage isLoading message="Loading analytics…" />}

      {!isLoading && !hasCurrencies && (
        <StatusMessage message="No compensation data is available for analytics yet." />
      )}

      {!isLoading && hasCurrencies && hasData && (
        <>
          <AnalyticsKpiCards
            currency={summary.currency}
            headcount={summary.headcount}
            totalPayroll={summary.totalPayroll}
          />

          <div className={styles.grid}>
            <AnalyticsDepartmentTable
              currency={departmentStatistics.currency}
              departments={departmentStatistics.departments}
            />
            <AnalyticsTopEarnersList
              currency={topEarners.currency}
              earners={topEarners.earners}
            />
          </div>
        </>
      )}
    </section>
  );
}
