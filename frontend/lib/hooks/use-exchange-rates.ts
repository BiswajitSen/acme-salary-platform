"use client";

import type { ExchangeRatesToUsd } from "@acme/shared";
import { useEffect, useState } from "react";

import { getAnalyticsCurrencies } from "@/lib/api/analytics";

type ExchangeRatesState = {
  ratesToUsd: ExchangeRatesToUsd | null;
  exchangeRatesAsOf: string | null;
  isLoading: boolean;
};

export function useExchangeRates(): ExchangeRatesState {
  const [ratesToUsd, setRatesToUsd] = useState<ExchangeRatesToUsd | null>(null);
  const [exchangeRatesAsOf, setExchangeRatesAsOf] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadExchangeRates() {
      try {
        const response = await getAnalyticsCurrencies();

        if (isCancelled) {
          return;
        }

        setRatesToUsd(response.ratesToUsd);
        setExchangeRatesAsOf(response.exchangeRatesAsOf);
      } catch {
        if (!isCancelled) {
          setRatesToUsd(null);
          setExchangeRatesAsOf(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadExchangeRates();

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    ratesToUsd,
    exchangeRatesAsOf,
    isLoading,
  };
}
