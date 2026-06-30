import type { ReactNode } from "react";
interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}
export declare function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  emptyMessage,
  className,
}: DataTableProps<T>): import("react").JSX.Element;
export {};
