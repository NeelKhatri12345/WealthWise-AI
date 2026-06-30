interface TransactionFiltersState {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: "all" | "credit" | "debit";
}
interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  categories: string[];
  onFilterChange: (filters: TransactionFiltersState) => void;
  onReset: () => void;
}
export declare const TransactionFilters: ({
  filters,
  categories,
  onFilterChange,
  onReset,
}: TransactionFiltersProps) => import("react").JSX.Element;
export {};
