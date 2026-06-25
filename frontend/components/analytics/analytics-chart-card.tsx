import type { ReactNode } from "react";

import styles from "./analytics-chart-card.module.css";

type AnalyticsChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function AnalyticsChartCard({
  title,
  subtitle,
  children,
  className,
}: AnalyticsChartCardProps) {
  const cardClassName = [styles.card, className].filter(Boolean).join(" ");

  return (
    <section className={cardClassName}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
