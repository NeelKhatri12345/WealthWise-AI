export function formatCurrency(amount, currency = "INR", locale = "en-IN") {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}
export function formatNumber(value, locale = "en-IN") {
    return new Intl.NumberFormat(locale).format(value);
}
export function formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}
export function formatCompactNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}
