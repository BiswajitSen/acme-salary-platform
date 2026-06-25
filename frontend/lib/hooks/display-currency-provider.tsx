"use client";

import {
  ANALYTICS_DISPLAY_CURRENCIES,
  DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
  type AnalyticsDisplayCurrency,
} from "@acme/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const DISPLAY_CURRENCY_STORAGE_KEY = "acme.displayCurrency";

function parseDisplayCurrency(value: string): AnalyticsDisplayCurrency | null {
  const normalized = value.trim().toUpperCase();
  return ANALYTICS_DISPLAY_CURRENCIES.includes(normalized as AnalyticsDisplayCurrency)
    ? (normalized as AnalyticsDisplayCurrency)
    : null;
}

type DisplayCurrencyContextValue = {
  currency: AnalyticsDisplayCurrency;
  selectCurrency: (currency: string) => void;
  isReady: boolean;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(null);

type DisplayCurrencyProviderProps = {
  children: ReactNode;
};

export function DisplayCurrencyProvider({ children }: DisplayCurrencyProviderProps) {
  const [currency, setCurrency] = useState<AnalyticsDisplayCurrency>(
    DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedCurrency = window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);

    if (storedCurrency) {
      const parsedCurrency = parseDisplayCurrency(storedCurrency);
      if (parsedCurrency !== null) {
        setCurrency(parsedCurrency);
      }
    }

    setIsReady(true);
  }, []);

  const selectCurrency = useCallback((nextCurrency: string) => {
    const parsedCurrency = parseDisplayCurrency(nextCurrency);
    if (parsedCurrency === null) {
      return;
    }

    setCurrency(parsedCurrency);
    window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, parsedCurrency);
  }, []);

  const value = useMemo(
    () => ({
      currency,
      selectCurrency,
      isReady,
    }),
    [currency, isReady, selectCurrency],
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>{children}</DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  const context = useContext(DisplayCurrencyContext);

  if (context === null) {
    throw new Error("useDisplayCurrency must be used within DisplayCurrencyProvider");
  }

  return context;
}
