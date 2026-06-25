"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ANALYTICS_CHART_COLORS } from "@/lib/analytics/chart-theme";
import type { AnalyticsHeadcountSlice } from "@/lib/analytics/types";

import styles from "./analytics-headcount-donut.module.css";

type AnalyticsHeadcountDonutProps = {
  slices: AnalyticsHeadcountSlice[];
};

export function AnalyticsHeadcountDonut({ slices }: AnalyticsHeadcountDonutProps) {
  if (slices.length === 0) {
    return <p className={styles.empty}>No headcount data available.</p>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="department"
              innerRadius={62}
              outerRadius={96}
              paddingAngle={2}
            >
              {slices.map((slice, index) => (
                <Cell
                  key={slice.department}
                  fill={ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const payload = item?.payload as AnalyticsHeadcountSlice | undefined;
                return [
                  `${Number(value ?? 0).toLocaleString()} (${payload?.percent ?? 0}%)`,
                  payload?.department ?? "Department",
                ];
              }}
              contentStyle={{
                borderRadius: "8px",
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className={styles.legend}>
        {slices.slice(0, 6).map((slice, index) => (
          <li key={slice.department} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{
                background: ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length],
              }}
            />
            <span className={styles.legendLabel}>{slice.department}</span>
            <span className={styles.legendValue}>{slice.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
