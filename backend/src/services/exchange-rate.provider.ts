import type { ExchangeRateSnapshot } from "@acme/shared";

export interface IExchangeRateProvider {
  fetchSnapshot(): Promise<ExchangeRateSnapshot>;
}
