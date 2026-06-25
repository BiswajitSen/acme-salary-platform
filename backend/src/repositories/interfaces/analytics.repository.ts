import type { ExchangeRatesToUsd } from "@acme/shared";

import type {
  CompensationTimelineRecord,
  DepartmentSalaryStatisticsRecord,
  ScopedSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";

export interface IAnalyticsRepository {
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
  findRecentCompensationEvents(
    asOfDate: string,
    withinMonths: number,
    reasons: readonly string[],
    country?: string,
    department?: string,
  ): Promise<CompensationTimelineRecord[]>;
  findRecentPromotions(
    asOfDate: string,
    withinMonths: number,
    country?: string,
    department?: string,
  ): Promise<CompensationTimelineRecord[]>;
}
