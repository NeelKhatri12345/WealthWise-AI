import { format, formatDistanceToNow, parseISO, isValid, startOfMonth, endOfMonth, subMonths, } from "date-fns";
export function formatDate(date, pattern = "dd MMM yyyy") {
    const parsed = typeof date === "string" ? parseISO(date) : date;
    return isValid(parsed) ? format(parsed, pattern) : "Invalid date";
}
export function formatDateTime(date) {
    return formatDate(date, "dd MMM yyyy, hh:mm a");
}
export function timeAgo(date) {
    const parsed = typeof date === "string" ? parseISO(date) : date;
    return isValid(parsed) ? formatDistanceToNow(parsed, { addSuffix: true }) : "Unknown";
}
export function getMonthRange(monthsBack = 0) {
    const target = subMonths(new Date(), monthsBack);
    return {
        start: startOfMonth(target),
        end: endOfMonth(target),
    };
}
