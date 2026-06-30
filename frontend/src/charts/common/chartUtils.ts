import { format, parseISO } from 'date-fns';

export function formatCurrency(
  value: number,
  currency = 'INR',
  compact = false
): string {
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

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(
  dateStr: string,
  pattern = 'MMM dd'
): string {
  try {
    const date =
      typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(date, pattern);
  } catch {
    return dateStr;
  }
}

export function formatDateForAxis(dateStr: string): string {
  return formatDate(dateStr, 'MMM dd');
}

export function formatMonthYear(dateStr: string): string {
  return formatDate(dateStr, 'MMM yyyy');
}

export function currencyAxisFormatter(
  this: Highcharts.AxisLabelsFormatterContextObject
): string {
  return formatCurrency(this.value as number, 'INR', true);
}

export function percentageAxisFormatter(
  this: Highcharts.AxisLabelsFormatterContextObject
): string {
  return formatPercentage(this.value as number);
}

export function currencyTooltipFormatter(value: number): string {
  return formatCurrency(value);
}

export function generateDateCategories(
  startDate: string,
  count: number,
  interval: 'day' | 'month' = 'month'
): string[] {
  const categories: string[] = [];
  const start = parseISO(startDate);

  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    if (interval === 'month') {
      d.setMonth(d.getMonth() + i);
      categories.push(format(d, 'MMM yyyy'));
    } else {
      d.setDate(d.getDate() + i);
      categories.push(format(d, 'MMM dd'));
    }
  }

  return categories;
}

export function getResponsiveHeight(
  baseHeight: number,
  minHeight = 250
): number {
  if (typeof window === 'undefined') return baseHeight;
  return window.innerWidth < 640
    ? Math.max(minHeight, baseHeight * 0.7)
    : baseHeight;
}
