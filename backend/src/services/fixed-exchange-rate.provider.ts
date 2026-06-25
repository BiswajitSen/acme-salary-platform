import type { ExchangeRateSnapshot } from "@acme/shared";

import type { IExchangeRateProvider } from "./exchange-rate.provider.js";

export class FixedExchangeRateProvider implements IExchangeRateProvider {
  constructor(private readonly snapshot: ExchangeRateSnapshot) {}

  async fetchSnapshot(): Promise<ExchangeRateSnapshot> {
    return this.snapshot;
  }
}
