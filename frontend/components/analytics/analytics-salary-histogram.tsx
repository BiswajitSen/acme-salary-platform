"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ANALYTICS_CHART_COLORS, ANALYTICS_CHART_GRID, ANALYTICS_CHART_MUTED } from "@/lib/analytics/chart-theme";
import { useMobileLayout } from "@/lib/hooks/use-mobile-layout";

import styles from "./analytics-salary-histogram.module.css";

type AnalyticsSalaryHistogramProps = {
  buckets: Array<{ label: string; count: number }>;
};

export function AnalyticsSalaryHistogram({ buckets }: AnalyticsSalaryHistogramProps) {
  const isMobileLayout = useMobileLayout();

  if (buckets.length === 0) {
    return <p className={styles.empty}>No salary distribution data available.</p>;
  }

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={isMobileLayout ? 240 : 260}>
        <BarChart
          data={buckets}
          margin={
            isMobileLayout
              ? { top: 8, right: 4, left: -12, bottom: 0 }
              : { top: 8, right: 8, left: 0, bottom: 0 }
          }
        >
          <CartesianGrid stroke={ANALYTICS_CHART_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: ANALYTICS_CHART_MUTED, fontSize: isMobileLayout ? 9 : 11 }}
            interval={isMobileLayout ? "preserveStartEnd" : 0}
            angle={isMobileLayout ? -35 : -18}
            textAnchor="end"
            height={isMobileLayout ? 82 : 70}
          />
          <YAxis
            tick={{ fill: ANALYTICS_CHART_MUTED, fontSize: isMobileLayout ? 10 : 12 }}
            allowDecimals={false}
            width={isMobileLayout ? 28 : undefined}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
          />
          <Bar dataKey="count" fill={ANALYTICS_CHART_COLORS[1]} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
