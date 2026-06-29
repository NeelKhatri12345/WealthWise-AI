import { format, parseISO } from 'date-fns';
export function formatCurrency(value, currency = 'INR', compact = false) {
    if (compact) {
        if (Math.abs(value) >= 1_00_00_000) {
            return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
        }
        if (Math.abs(value) >= 1_00_000) {
            return `₹${(value / 1_00_000).toFixed(1)}L`;
        }
        if (Math.abs(value) >= 1_000) {
            return `₹${(value / 1_000).toFixed(1)}K`;
        }
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}
export function formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}
export function formatDate(dateStr, pattern = 'MMM dd') {
    try {
        const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
        return format(date, pattern);
    }
    catch {
        return dateStr;
    }
}
export function formatDateForAxis(dateStr) {
    return formatDate(dateStr, 'MMM dd');
}
export function formatMonthYear(dateStr) {
    return formatDate(dateStr, 'MMM yyyy');
}
export function currencyAxisFormatter() {
    const ctx = this;
    return formatCurrency(ctx.value, 'INR', true);
}
export function percentageAxisFormatter() {
    const ctx = this;
    return formatPercentage(ctx.value);
}
export function currencyTooltipFormatter(value) {
    return formatCurrency(value);
}
export function generateDateCategories(startDate, count, interval = 'month') {
    const categories = [];
    const start = parseISO(startDate);
    for (let i = 0; i < count; i++) {
        const d = new Date(start);
        if (interval === 'month') {
            d.setMonth(d.getMonth() + i);
            categories.push(format(d, 'MMM yyyy'));
        }
        else {
            d.setDate(d.getDate() + i);
            categories.push(format(d, 'MMM dd'));
        }
    }
    return categories;
}
export function getResponsiveHeight(baseHeight, minHeight = 250) {
    if (typeof window === 'undefined')
        return baseHeight;
    return window.innerWidth < 640
        ? Math.max(minHeight, baseHeight * 0.7)
        : baseHeight;
}
