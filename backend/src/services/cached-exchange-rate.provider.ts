import type { ExchangeRateSnapshot } from "@acme/shared";

import type { IExchangeRateProvider } from "./exchange-rate.provider.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export class CachedExchangeRateProvider implements IExchangeRateProvider {
  private cachedSnapshot: ExchangeRateSnapshot | null = null;
  private cachedAtMs = 0;

  constructor(
    private readonly source: IExchangeRateProvider,
    private readonly ttlMs = ONE_DAY_MS,
  ) {}

  async fetchSnapshot(): Promise<ExchangeRateSnapshot> {
    if (this.cachedSnapshot && Date.now() - this.cachedAtMs < this.ttlMs) {
      return this.cachedSnapshot;
    }

    try {
      const freshSnapshot = await this.source.fetchSnapshot();
      this.cachedSnapshot = freshSnapshot;
      this.cachedAtMs = Date.now();
      return freshSnapshot;
    } catch (error) {
      if (this.cachedSnapshot) {
        return this.cachedSnapshot;
      }

      throw error;
    }
  }
}
