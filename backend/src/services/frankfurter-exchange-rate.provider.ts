import {
  ANALYTICS_DISPLAY_CURRENCIES,
  type ExchangeRateSnapshot,
} from "@acme/shared";

import { buildRatesToUsdFromFrankfurterResponse } from "../domain/frankfurter-exchange-rates.js";
import type { IExchangeRateProvider } from "./exchange-rate.provider.js";

type FrankfurterLatestResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

export class FrankfurterExchangeRateProvider implements IExchangeRateProvider {
  constructor(
    private readonly apiBaseUrl = "https://api.frankfurter.app",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async fetchSnapshot(): Promise<ExchangeRateSnapshot> {
    const symbols = ANALYTICS_DISPLAY_CURRENCIES.filter((currency) => currency !== "USD").join(
      ",",
    );
    const response = await this.fetchImpl(
      `${this.apiBaseUrl}/latest?from=USD&to=${symbols}`,
    );

    if (!response.ok) {
      throw new Error(`Frankfurter exchange rate request failed with ${response.status}`);
    }

    const payload = (await response.json()) as FrankfurterLatestResponse;

    return {
      asOf: payload.date,
      ratesToUsd: buildRatesToUsdFromFrankfurterResponse(payload),
    };
  }
}
