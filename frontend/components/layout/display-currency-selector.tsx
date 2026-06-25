"use client";

import { ANALYTICS_DISPLAY_CURRENCIES } from "@acme/shared";

import { Select } from "@/components/ui/select";
import { useDisplayCurrency } from "@/lib/hooks/use-display-currency";

import styles from "./display-currency-selector.module.css";

export function DisplayCurrencySelector() {
  const { currency, selectCurrency } = useDisplayCurrency();

  return (
    <div className={styles.wrapper}>
      <Select
        id="global-display-currency"
        label="Display currency"
        className={styles.select}
        value={currency}
        onChange={(event) => selectCurrency(event.target.value)}
      >
        {ANALYTICS_DISPLAY_CURRENCIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}
