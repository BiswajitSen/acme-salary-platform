"use client";

import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMessage } from "@/components/ui/status-message";
import { AnalyticsDashboardSkeleton } from "@/components/analytics/analytics-dashboard-skeleton";
import { AnalyticsDepartmentPayrollSection } from "@/components/analytics/analytics-department-payroll-section";
import { AnalyticsExecutiveInsights } from "@/components/analytics/analytics-executive-insights";
import { AnalyticsFilterBar } from "@/components/analytics/analytics-filter-bar";
import { AnalyticsHeadcountDonut } from "@/components/analytics/analytics-headcount-donut";
import { AnalyticsHighlightsSection } from "@/components/analytics/analytics-highlights";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import {
  AnalyticsLocationPayrollChart,
  AnalyticsRoleSalaryChart,
} from "@/components/analytics/analytics-location-role-charts";
import { AnalyticsChartCard } from "@/components/analytics/analytics-chart-card";
import { AnalyticsSalaryHeatmap } from "@/components/analytics/analytics-salary-heatmap";
import { AnalyticsSalaryHistogram } from "@/components/analytics/analytics-salary-histogram";
import { AnalyticsTopEarnersList } from "@/components/analytics/analytics-top-earners-list";
import { ANNUAL_COMPENSATION_NOTE } from "@/lib/analytics/format-analytics-salary";
import { useAnalyticsDashboard } from "@/lib/hooks/use-analytics-dashboard";

import styles from "./analytics-dashboard.module.css";

export function AnalyticsDashboard() {
  const {
    availableCurrencies,
    currency,
    exchangeRatesAsOf,
    filterOptions,
    filters,
    view,
    isLoading,
    errorMessage,
    selectCurrency,
    setFilter,
    resetFilters,
  } = useAnalyticsDashboard();

  const hasCurrencies = availableCurrencies.length > 0;

  return (
    <section className={styles.page}>
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Executive compensation intelligence across locations, roles, and departments. All figures are annual base salary."
      />

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {isLoading && (
        <>
          <StatusMessage isLoading message="Loading analytics…" />
          <AnalyticsDashboardSkeleton />
        </>
      )}

      {!isLoading && !hasCurrencies && (
        <StatusMessage message="No compensation data is available for analytics yet." />
      )}

      {!isLoading && hasCurrencies && view && (
        <>
          <AnalyticsFilterBar
            filters={filters}
            filterOptions={filterOptions}
            currency={currency}
            onFilterChange={setFilter}
            onCurrencyChange={selectCurrency}
            onReset={resetFilters}
          />

          <p className={styles.metaNote}>{ANNUAL_COMPENSATION_NOTE}</p>
          <p className={styles.metaNote}>
            FX rates as of {exchangeRatesAsOf ?? view.exchangeRatesAsOf}
          </p>

          <AnalyticsKpiCards currency={view.currency} kpis={view.kpis} />

          <div className={styles.gridTwo}>
            <AnalyticsDepartmentPayrollSection
              currency={view.currency}
              departments={view.departments}
            />
            <AnalyticsTopEarnersList currency={view.currency} earners={view.topEarners} />
          </div>

          <div className={styles.gridTwo}>
            <AnalyticsLocationPayrollChart currency={view.currency} locations={view.locations} />
            <AnalyticsRoleSalaryChart currency={view.currency} roles={view.roles} />
          </div>

          <div className={styles.gridTwo}>
            <AnalyticsChartCard
              title="Salary distribution"
              subtitle="Annual base salary concentration across pay bands"
            >
              <AnalyticsSalaryHistogram buckets={view.histogram} />
            </AnalyticsChartCard>
            <AnalyticsChartCard
              title="Headcount by department"
              subtitle="Share of employees per department"
            >
              <AnalyticsHeadcountDonut slices={view.headcountByDepartment} />
            </AnalyticsChartCard>
          </div>

          <AnalyticsChartCard
            title="Salary heatmap"
            subtitle="Average annual base salary by location and department"
          >
            <AnalyticsSalaryHeatmap currency={view.currency} heatmap={view.heatmap} />
          </AnalyticsChartCard>

          <div className={styles.gridTwo}>
            <AnalyticsExecutiveInsights insights={view.insights} />
            <AnalyticsHighlightsSection currency={view.currency} highlights={view.highlights} />
          </div>
        </>
      )}
    </section>
  );
}
