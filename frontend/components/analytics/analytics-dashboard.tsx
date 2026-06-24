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

const SUPPORTED_CURRENCIES = ["USD", "GBP", "EUR"] as const;

export function AnalyticsDashboard() {
  const {
    currency,
    summary,
    departmentStatistics,
    topEarners,
    isLoading,
    errorMessage,
    selectCurrency,
  } = useAnalyticsDashboard();

  const hasData = summary !== null && departmentStatistics !== null && topEarners !== null;

  return (
    <section className={styles.page}>
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Leadership metrics grouped by currency"
        actions={
          <Select
            id="analytics-currency"
            label="Currency"
            value={currency}
            onChange={(event) => selectCurrency(event.target.value)}
          >
            {SUPPORTED_CURRENCIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        }
      />

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {isLoading && <StatusMessage isLoading message="Loading analytics…" />}

      {!isLoading && hasData && (
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
