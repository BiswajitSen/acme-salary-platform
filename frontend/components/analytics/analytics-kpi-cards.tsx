import type { AnalyticsKpiSnapshot } from "@/lib/analytics/types";
import { formatAnnualSalary } from "@/lib/analytics/format-analytics-salary";

import styles from "./analytics-kpi-cards.module.css";

type AnalyticsKpiCardsProps = {
  currency: string;
  kpis: AnalyticsKpiSnapshot;
};

const KPI_ITEMS = [
  {
    key: "headcount",
    icon: "👥",
    label: "Total Employees",
    hint: "Employees with compensation",
    tone: "blue",
  },
  {
    key: "totalPayroll",
    icon: "💰",
    label: "Total Payroll",
    hint: "Annual payroll in selected currency",
    tone: "green",
  },
  {
    key: "averageSalary",
    icon: "📊",
    label: "Average Salary",
    hint: "Annual base salary across employees",
    tone: "violet",
  },
  {
    key: "medianSalary",
    icon: "📈",
    label: "Median Salary",
    hint: "Annual base salary, less affected by outliers",
    tone: "cyan",
  },
  {
    key: "highestPaidDepartment",
    icon: "🏢",
    label: "Highest Paid Department",
    hint: "By average annual base salary",
    tone: "amber",
  },
  {
    key: "highestPaidLocation",
    icon: "🌍",
    label: "Highest Paid Location",
    hint: "By average annual base salary",
    tone: "rose",
  },
] as const;

function formatKpiValue(
  key: (typeof KPI_ITEMS)[number]["key"],
  kpis: AnalyticsKpiSnapshot,
  currency: string,
): string {
  switch (key) {
    case "headcount":
      return kpis.headcount.toLocaleString();
    case "totalPayroll":
      return formatAnnualSalary(kpis.totalPayroll, currency);
    case "averageSalary":
      return formatAnnualSalary(kpis.averageSalary, currency);
    case "medianSalary":
      return formatAnnualSalary(kpis.medianSalary, currency);
    case "highestPaidDepartment":
      return kpis.highestPaidDepartment?.name ?? "—";
    case "highestPaidLocation":
      return kpis.highestPaidLocation?.name ?? "—";
  }
}

function formatKpiSubvalue(
  key: (typeof KPI_ITEMS)[number]["key"],
  kpis: AnalyticsKpiSnapshot,
  currency: string,
): string | null {
  if (key === "highestPaidDepartment" && kpis.highestPaidDepartment) {
    return `${formatAnnualSalary(kpis.highestPaidDepartment.averageSalary, currency)} avg/yr`;
  }

  if (key === "highestPaidLocation" && kpis.highestPaidLocation) {
    return `${formatAnnualSalary(kpis.highestPaidLocation.averageSalary, currency)} avg/yr`;
  }

  return null;
}

export function AnalyticsKpiCards({ currency, kpis }: AnalyticsKpiCardsProps) {
  return (
    <div className={styles.grid}>
      {KPI_ITEMS.map((item) => {
        const subvalue = formatKpiSubvalue(item.key, kpis, currency);

        return (
          <article key={item.key} className={styles.card}>
            <div className={`${styles.iconWrap} ${styles[item.tone]}`} aria-hidden="true">
              {item.icon}
            </div>
            <div className={styles.content}>
              <p className={styles.label}>{item.label}</p>
              <p className={styles.value}>{formatKpiValue(item.key, kpis, currency)}</p>
              <p className={styles.hint}>{subvalue ?? item.hint}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
