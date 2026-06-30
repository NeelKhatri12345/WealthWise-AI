export declare function formatDate(
  date: string | Date,
  pattern?: string,
): string;
export declare function formatDateTime(date: string | Date): string;
export declare function timeAgo(date: string | Date): string;
export declare function getMonthRange(monthsBack?: number): {
  start: Date;
  end: Date;
};
