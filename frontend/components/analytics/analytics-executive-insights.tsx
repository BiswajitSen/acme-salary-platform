import { AnalyticsChartCard } from "./analytics-chart-card";

import styles from "./analytics-executive-insights.module.css";

type AnalyticsExecutiveInsightsProps = {
  insights: string[];
};

export function AnalyticsExecutiveInsights({ insights }: AnalyticsExecutiveInsightsProps) {
  return (
    <AnalyticsChartCard title="Executive insights" subtitle="Generated from the current dataset">
      {insights.length === 0 ? (
        <p className={styles.empty}>No insights available for the current filters.</p>
      ) : (
        <ul className={styles.list}>
          {insights.map((insight) => (
            <li key={insight} className={styles.item}>
              <span aria-hidden="true">✅</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </AnalyticsChartCard>
  );
}
