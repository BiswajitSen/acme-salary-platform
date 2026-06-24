export interface IAnalyticsRepository {
  countEmployeesWithLatestCompensationInCurrency(currency: string): Promise<number>;
}
