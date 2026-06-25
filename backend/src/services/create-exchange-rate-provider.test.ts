import { afterEach, describe, expect, it, vi } from "vitest";

import { createTestExchangeRateSnapshot } from "@acme/shared";

describe("createExchangeRateProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns a fixed provider in test mode", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const { createExchangeRateProvider } = await import("./create-exchange-rate-provider.js");
    const provider = createExchangeRateProvider();

    await expect(provider.fetchSnapshot()).resolves.toEqual(createTestExchangeRateSnapshot());
  });

  it("returns a cached Frankfurter provider outside test mode", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          date: "2026-06-24",
          rates: { GBP: 0.8, EUR: 0.5, INR: 80, SGD: 1.25 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const { createExchangeRateProvider } = await import("./create-exchange-rate-provider.js");
    const provider = createExchangeRateProvider();

    await expect(provider.fetchSnapshot()).resolves.toEqual({
      asOf: "2026-06-24",
      ratesToUsd: {
        USD: 1,
        GBP: 1.25,
        EUR: 2,
        INR: 0.0125,
        SGD: 0.8,
      },
    });
  });
});
