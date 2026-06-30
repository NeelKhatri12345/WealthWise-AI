import type { ReactNode } from "react";
interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}
export declare function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  className,
  emptyMessage,
  onRowClick,
}: TableProps<T>): import("react").JSX.Element;
export {};
