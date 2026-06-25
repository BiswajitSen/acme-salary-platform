import { createTestExchangeRateSnapshot } from "@acme/shared";

import { env } from "../config/env.js";
import { CachedExchangeRateProvider } from "./cached-exchange-rate.provider.js";
import type { IExchangeRateProvider } from "./exchange-rate.provider.js";
import { FixedExchangeRateProvider } from "./fixed-exchange-rate.provider.js";
import { FrankfurterExchangeRateProvider } from "./frankfurter-exchange-rate.provider.js";

export function createExchangeRateProvider(): IExchangeRateProvider {
  if (env.NODE_ENV === "test") {
    return new FixedExchangeRateProvider(createTestExchangeRateSnapshot());
  }

  const frankfurterProvider = new FrankfurterExchangeRateProvider(env.FRANKFURTER_API_URL);
  return new CachedExchangeRateProvider(frankfurterProvider);
}
