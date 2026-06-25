"use client";

import { DEFAULT_ANALYTICS_DISPLAY_CURRENCY } from "@acme/shared";
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

type DisplayCurrencyContextValue = {
  currency: string;
  selectCurrency: (currency: string) => void;
  isReady: boolean;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(null);

type DisplayCurrencyProviderProps = {
  children: ReactNode;
};

export function DisplayCurrencyProvider({ children }: DisplayCurrencyProviderProps) {
  const [currency, setCurrency] = useState(DEFAULT_ANALYTICS_DISPLAY_CURRENCY);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedCurrency = window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);

    if (storedCurrency) {
      setCurrency(storedCurrency.toUpperCase());
    }

    setIsReady(true);
  }, []);

  const selectCurrency = useCallback((nextCurrency: string) => {
    const normalizedCurrency = nextCurrency.toUpperCase();
    setCurrency(normalizedCurrency);
    window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, normalizedCurrency);
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
