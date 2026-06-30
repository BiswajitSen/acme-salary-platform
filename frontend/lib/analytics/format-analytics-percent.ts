export function formatAnalyticsPercent(value: number): string {
  if (value <= 0) {
    return "0%";
  }

  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export function formatPayrollPercent(value: number): string {
  if (value <= 0) {
    return "0%";
  }

  if (value < 1) {
    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toFixed(2)}%`;
  }

  return formatAnalyticsPercent(value);
}
