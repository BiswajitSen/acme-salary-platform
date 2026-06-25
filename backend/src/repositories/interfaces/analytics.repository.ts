import type { ExchangeRatesToUsd } from "@acme/shared";

import type { EmployeeScopeParams } from "../../domain/insights/employee-scope.js";
import type {
  CompensationTimelineRecord,
  DepartmentSalaryStatisticsRecord,
  ScopedSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";
import type { InsightTimelineWindow } from "../../domain/insights/timeline/window.js";

export interface IAnalyticsRepository {
  countEmployeesWithLatestCompensation(scope?: EmployeeScopeParams): Promise<number>;
  sumLatestCompensationSalariesInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    scope?: EmployeeScopeParams,
  ): Promise<number>;
  findDepartmentSalaryStatisticsInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
  ): Promise<DepartmentSalaryStatisticsRecord[]>;
  findSalaryStatisticsInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    scope?: EmployeeScopeParams,
  ): Promise<ScopedSalaryStatisticsRecord>;
  findTopEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    limit: number,
    scope?: EmployeeScopeParams,
  ): Promise<TopEarnerRecord[]>;
  findBottomEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    limit: number,
    scope?: EmployeeScopeParams,
  ): Promise<TopEarnerRecord[]>;
  findNearMedianEarnersInDisplayCurrency(
    displayCurrency: string,
    ratesToUsd: ExchangeRatesToUsd,
    tolerancePercent: number,
    scope?: EmployeeScopeParams,
  ): Promise<{ medianSalary: number; earners: TopEarnerRecord[] }>;
  findRecentCompensationEvents(
    asOfDate: string,
    window: InsightTimelineWindow,
    reasons: readonly string[],
    scope?: EmployeeScopeParams,
  ): Promise<CompensationTimelineRecord[]>;
  findRecentPromotions(
    asOfDate: string,
    window: InsightTimelineWindow,
    scope?: EmployeeScopeParams,
  ): Promise<CompensationTimelineRecord[]>;
}
