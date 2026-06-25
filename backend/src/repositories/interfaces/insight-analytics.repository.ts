import type {
  DepartmentSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";

export interface IInsightAnalyticsRepository {
  countEmployeesWithLatestCompensation(): Promise<number>;
  sumLatestCompensationSalariesInDisplayCurrency(currency: string): Promise<number>;
  findDepartmentSalaryStatisticsInDisplayCurrency(
    displayCurrency: string,
  ): Promise<DepartmentSalaryStatisticsRecord[]>;
  findTopEarnersInDisplayCurrency(
    displayCurrency: string,
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
