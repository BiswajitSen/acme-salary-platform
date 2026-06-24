export interface IAnalyticsRepository {
  countEmployeesWithLatestCompensationInCurrency(currency: string): Promise<number>;
  sumLatestCompensationSalariesInCurrency(currency: string): Promise<number>;
}
