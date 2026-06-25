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

import styles from "./analytics-salary-histogram.module.css";

type AnalyticsSalaryHistogramProps = {
  buckets: Array<{ label: string; count: number }>;
};

export function AnalyticsSalaryHistogram({ buckets }: AnalyticsSalaryHistogramProps) {
  if (buckets.length === 0) {
    return <p className={styles.empty}>No salary distribution data available.</p>;
  }

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={ANALYTICS_CHART_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: ANALYTICS_CHART_MUTED, fontSize: 11 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={70}
          />
          <YAxis tick={{ fill: ANALYTICS_CHART_MUTED, fontSize: 12 }} allowDecimals={false} />
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
