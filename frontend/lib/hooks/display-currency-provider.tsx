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
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const DISPLAY_CURRENCY_STORAGE_KEY = "acme.displayCurrency";

const currencyListeners = new Set<() => void>();

function parseDisplayCurrency(value: string): AnalyticsDisplayCurrency | null {
  const normalized = value.trim().toUpperCase();
  return ANALYTICS_DISPLAY_CURRENCIES.includes(normalized as AnalyticsDisplayCurrency)
    ? (normalized as AnalyticsDisplayCurrency)
    : null;
}

function readStoredCurrency(): AnalyticsDisplayCurrency {
  const storedCurrency = window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);

  if (!storedCurrency) {
    return DEFAULT_ANALYTICS_DISPLAY_CURRENCY;
  }

  return parseDisplayCurrency(storedCurrency) ?? DEFAULT_ANALYTICS_DISPLAY_CURRENCY;
}

function subscribeToCurrencyChanges(listener: () => void): () => void {
  currencyListeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === DISPLAY_CURRENCY_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    currencyListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function notifyCurrencyChange(): void {
  for (const listener of currencyListeners) {
    listener();
  }
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
  const currency = useSyncExternalStore(
    subscribeToCurrencyChanges,
    readStoredCurrency,
    () => DEFAULT_ANALYTICS_DISPLAY_CURRENCY,
  );

  const isReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const selectCurrency = useCallback((nextCurrency: string) => {
    const parsedCurrency = parseDisplayCurrency(nextCurrency);
    if (parsedCurrency === null) {
      return;
    }

    window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, parsedCurrency);
    notifyCurrencyChange();
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
