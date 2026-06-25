import styles from "./analytics-dashboard-skeleton.module.css";

export function AnalyticsDashboardSkeleton() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.filterBar} />
      <div className={styles.kpiGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.kpiCard} />
        ))}
      </div>
      <div className={styles.gridTwo}>
        <div className={styles.panel} />
        <div className={styles.panel} />
      </div>
      <div className={styles.gridTwo}>
        <div className={styles.panel} />
        <div className={styles.panel} />
      </div>
    </div>
  );
}
