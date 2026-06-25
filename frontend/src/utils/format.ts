export function formatCurrency(
  amount: number,
  currency: string = "INR",
  locale: string = "en-IN",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(
  value: number,
  locale: string = "en-IN",
): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}
