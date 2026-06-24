import type {
  DepartmentSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";

export interface IAnalyticsRepository {
  findAvailableCurrencies(): Promise<string[]>;
  countEmployeesWithLatestCompensationInCurrency(currency: string): Promise<number>;
  sumLatestCompensationSalariesInCurrency(currency: string): Promise<number>;
  findDepartmentSalaryStatisticsByCurrency(
    currency: string,
  ): Promise<DepartmentSalaryStatisticsRecord[]>;
  findTopEarnersByCurrency(currency: string, limit: number): Promise<TopEarnerRecord[]>;
}
