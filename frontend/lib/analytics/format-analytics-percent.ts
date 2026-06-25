export function formatAnalyticsPercent(value: number): string {
  if (value <= 0) {
    return "0%";
  }

  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}
