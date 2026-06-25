import type {
  DepartmentSalaryStatisticsRecord,
  TopEarnerRecord,
} from "../../domain/analytics.types.js";

export interface IAnalyticsRepository {
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
