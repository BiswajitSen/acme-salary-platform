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

import styles from "./analytics-horizontal-bar-chart.module.css";

type HorizontalBarDatum = {
  label: string;
  value: number;
};

type AnalyticsHorizontalBarChartProps = {
  data: HorizontalBarDatum[];
  valueFormatter: (value: number) => string;
  emptyMessage: string;
};

export function AnalyticsHorizontalBarChart({
  data,
  valueFormatter,
  emptyMessage,
}: AnalyticsHorizontalBarChartProps) {
  if (data.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 42)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
          <CartesianGrid stroke={ANALYTICS_CHART_GRID} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: ANALYTICS_CHART_MUTED, fontSize: 12 }}
            tickFormatter={(value: number) => valueFormatter(value)}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            tick={{ fill: ANALYTICS_CHART_MUTED, fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => valueFormatter(Number(value ?? 0))}
            labelStyle={{ color: "var(--foreground)" }}
            contentStyle={{
              borderRadius: "8px",
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
          />
          <Bar dataKey="value" fill={ANALYTICS_CHART_COLORS[0]} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
