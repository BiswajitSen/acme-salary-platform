import type { DepartmentSalaryStatisticsRecord } from "../../domain/analytics.types.js";

export interface IAnalyticsRepository {
  countEmployeesWithLatestCompensationInCurrency(currency: string): Promise<number>;
  sumLatestCompensationSalariesInCurrency(currency: string): Promise<number>;
  findDepartmentSalaryStatisticsByCurrency(
    currency: string,
  ): Promise<DepartmentSalaryStatisticsRecord[]>;
}
