"use client";

import { ANALYTICS_DISPLAY_CURRENCIES } from "@acme/shared";

import { useDisplayCurrency } from "@/lib/hooks/use-display-currency";

import styles from "./display-currency-selector.module.css";

export function DisplayCurrencySelector() {
  const { currency, selectCurrency } = useDisplayCurrency();

  return (
    <div className={styles.wrapper}>
      <label className={styles.control} htmlFor="global-display-currency">
        <span className={styles.prefix}>Currency</span>
        <select
          id="global-display-currency"
          className={styles.select}
          value={currency}
          aria-label="Display currency"
          onChange={(event) => selectCurrency(event.target.value)}
        >
          {ANALYTICS_DISPLAY_CURRENCIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
