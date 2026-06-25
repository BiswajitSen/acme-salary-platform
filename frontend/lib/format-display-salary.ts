import {
  convertCurrencyAmount,
  type ExchangeRatesToUsd,
} from "@acme/shared";

import { formatSalary } from "./format-salary";

export function formatDisplaySalary(
  amount: number,
  nativeCurrency: string,
  displayCurrency: string,
  ratesToUsd: ExchangeRatesToUsd,
): string {
  if (nativeCurrency === displayCurrency) {
    return formatSalary(amount, displayCurrency);
  }

  try {
    const convertedAmount = convertCurrencyAmount(
      amount,
      nativeCurrency,
      displayCurrency,
      ratesToUsd,
    );

    return formatSalary(convertedAmount, displayCurrency);
  } catch {
    return formatSalary(amount, nativeCurrency);
  }
}
