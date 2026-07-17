import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";

export function formatDate(
  date: string | Date,
  pattern: string = "dd MMM yyyy",
): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return isValid(parsed) ? format(parsed, pattern) : "Invalid date";
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd MMM yyyy, hh:mm a");
}

export function timeAgo(date: string | Date): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return isValid(parsed)
    ? formatDistanceToNow(parsed, { addSuffix: true })
    : "Unknown";
}

export function getMonthRange(monthsBack: number = 0) {
  const target = subMonths(new Date(), monthsBack);
  return {
    start: startOfMonth(target),
    end: endOfMonth(target),
  };
}
