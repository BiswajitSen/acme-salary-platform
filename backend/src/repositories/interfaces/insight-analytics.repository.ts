import type {
  DepartmentSalaryStatisticsRecord,
  RecentPromotionRecord,
  ScopedSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";
import type { ExchangeRatesToUsd } from "@acme/shared";

export interface IInsightAnalyticsRepository {
  countEmployeesWithLatestCompensation(country?: string, department?: string): Promise<number>;
  sumLatestCompensationSalariesInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    country?: string,
    department?: string,
  ): Promise<number>;
  findDepartmentSalaryStatisticsInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
  ): Promise<DepartmentSalaryStatisticsRecord[]>;
  findSalaryStatisticsInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    country?: string,
    department?: string,
  ): Promise<ScopedSalaryStatisticsRecord>;
  findTopEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    limit: number,
    country?: string,
    department?: string,
  ): Promise<TopEarnerRecord[]>;
  findRecentPromotions(
    asOfDate: string,
    withinMonths: number,
    country?: string,
    department?: string,
  ): Promise<RecentPromotionRecord[]>;
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
