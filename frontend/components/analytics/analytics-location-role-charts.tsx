import type { AnalyticsLocationRow, AnalyticsRoleRow } from "@/lib/analytics/types";
import { formatAnnualSalary } from "@/lib/analytics/format-analytics-salary";

import { AnalyticsChartCard } from "./analytics-chart-card";
import { AnalyticsHorizontalBarChart } from "./analytics-horizontal-bar-chart";

type AnalyticsLocationPayrollChartProps = {
  currency: string;
  locations: AnalyticsLocationRow[];
};

export function AnalyticsLocationPayrollChart({
  currency,
  locations,
}: AnalyticsLocationPayrollChartProps) {
  return (
    <AnalyticsChartCard title="Payroll by location" subtitle="Annual payroll distribution across offices">
      <AnalyticsHorizontalBarChart
        data={locations.map((location) => ({
          label: location.label,
          value: location.payroll,
        }))}
        valueFormatter={(value) => formatAnnualSalary(value, currency)}
        emptyMessage="No location payroll data available."
      />
    </AnalyticsChartCard>
  );
}

type AnalyticsRoleSalaryChartProps = {
  currency: string;
  roles: AnalyticsRoleRow[];
};

export function AnalyticsRoleSalaryChart({ currency, roles }: AnalyticsRoleSalaryChartProps) {
  return (
    <AnalyticsChartCard title="Average salary by role" subtitle="Top roles by average annual base salary">
      <AnalyticsHorizontalBarChart
        data={roles.map((role) => ({
          label: role.jobTitle,
          value: role.averageSalary,
        }))}
        valueFormatter={(value) => formatAnnualSalary(value, currency)}
        emptyMessage="No role salary data available."
      />
    </AnalyticsChartCard>
  );
}
