import { describe, expect, it, vi } from "vitest";

import { createTestExchangeRateSnapshot } from "@acme/shared";

import { CachedExchangeRateProvider } from "./cached-exchange-rate.provider.js";
import { FixedExchangeRateProvider } from "./fixed-exchange-rate.provider.js";
import { FrankfurterExchangeRateProvider } from "./frankfurter-exchange-rate.provider.js";

describe("FrankfurterExchangeRateProvider", () => {
  it("fetches daily exchange rates from Frankfurter", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          date: "2026-06-24",
          rates: {
            GBP: 0.8,
            EUR: 0.5,
            INR: 80,
            SGD: 1.25,
          },
        }),
        { status: 200 },
      ),
    );

    const provider = new FrankfurterExchangeRateProvider("https://api.frankfurter.app", fetchImpl);

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

  it("throws when Frankfurter returns a non-success response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 503 }));
    const provider = new FrankfurterExchangeRateProvider(
      "https://api.frankfurter.app",
      fetchImpl,
    );

    await expect(provider.fetchSnapshot()).rejects.toThrow(
      "Frankfurter exchange rate request failed with 503",
    );
  });
});

describe("CachedExchangeRateProvider", () => {
  it("reuses the cached snapshot for one day", async () => {
    const source = {
      fetchSnapshot: vi.fn().mockResolvedValue(createTestExchangeRateSnapshot("2026-06-24")),
    };
    const provider = new CachedExchangeRateProvider(source, 86_400_000);

    await provider.fetchSnapshot();
    await provider.fetchSnapshot();

    expect(source.fetchSnapshot).toHaveBeenCalledTimes(1);
  });

  it("refreshes an expired cache when the source succeeds", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-24T00:00:00.000Z"));

    const source = {
      fetchSnapshot: vi
        .fn()
        .mockResolvedValueOnce(createTestExchangeRateSnapshot("2026-06-24"))
        .mockResolvedValueOnce(createTestExchangeRateSnapshot("2026-06-25")),
    };
    const provider = new CachedExchangeRateProvider(source, 1_000);

    await expect(provider.fetchSnapshot()).resolves.toEqual(
      createTestExchangeRateSnapshot("2026-06-24"),
    );

    vi.setSystemTime(new Date("2026-06-24T00:00:10.000Z"));

    await expect(provider.fetchSnapshot()).resolves.toEqual(
      createTestExchangeRateSnapshot("2026-06-25"),
    );
    expect(source.fetchSnapshot).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("falls back to the last good snapshot when refresh fails", async () => {
    const source = {
      fetchSnapshot: vi
        .fn()
        .mockResolvedValueOnce(createTestExchangeRateSnapshot("2026-06-24"))
        .mockRejectedValueOnce(new Error("Network error")),
    };
    const provider = new CachedExchangeRateProvider(source, 0);

    await expect(provider.fetchSnapshot()).resolves.toEqual(
      createTestExchangeRateSnapshot("2026-06-24"),
    );
    await expect(provider.fetchSnapshot()).resolves.toEqual(
      createTestExchangeRateSnapshot("2026-06-24"),
    );
  });

  it("throws when refresh fails and no cached snapshot exists", async () => {
    const provider = new CachedExchangeRateProvider({
      fetchSnapshot: vi.fn().mockRejectedValue(new Error("Network error")),
    });

    await expect(provider.fetchSnapshot()).rejects.toThrow("Network error");
  });
});

describe("FixedExchangeRateProvider", () => {
  it("returns the configured snapshot", async () => {
    const provider = new FixedExchangeRateProvider(createTestExchangeRateSnapshot());

    await expect(provider.fetchSnapshot()).resolves.toEqual(createTestExchangeRateSnapshot());
  });
});
