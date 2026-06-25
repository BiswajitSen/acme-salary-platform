import type {
  DepartmentSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";
import type { ExchangeRatesToUsd } from "@acme/shared";

export interface IInsightAnalyticsRepository {
  countEmployeesWithLatestCompensation(): Promise<number>;
  sumLatestCompensationSalariesInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
  ): Promise<number>;
  findDepartmentSalaryStatisticsInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
  ): Promise<DepartmentSalaryStatisticsRecord[]>;
  findTopEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    limit: number,
  ): Promise<TopEarnerRecord[]>;
}

export type InsightAnalyticsWriteOperation =
  | "insert"
  | "update"
  | "delete"
  | "upsert"
  | "create"
  | "remove";

export const INSIGHT_ANALYTICS_FORBIDDEN_OPERATIONS = [
  "insert",
  "update",
  "delete",
  "upsert",
  "create",
  "remove",
] as const satisfies readonly InsightAnalyticsWriteOperation[];
