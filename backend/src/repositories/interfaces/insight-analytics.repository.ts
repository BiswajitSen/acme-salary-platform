import type {
  DepartmentSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";

export interface IInsightAnalyticsRepository {
  countEmployeesWithLatestCompensationInCurrency(currency: string): Promise<number>;
  sumLatestCompensationSalariesInCurrency(currency: string): Promise<number>;
  findDepartmentSalaryStatisticsByCurrency(
    currency: string,
  ): Promise<DepartmentSalaryStatisticsRecord[]>;
  findTopEarnersByCurrency(currency: string, limit: number): Promise<TopEarnerRecord[]>;
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
