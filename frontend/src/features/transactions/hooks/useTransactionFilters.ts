import { useState, useCallback } from "react";

interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: "all" | "credit" | "debit";
}

const defaultFilters: TransactionFilters = {
  type: "all",
};

interface UseTransactionFiltersReturn {
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export const useTransactionFilters = (): UseTransactionFiltersReturn => {
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters =
    !!filters.dateFrom ||
    !!filters.dateTo ||
    !!filters.category ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined ||
    (filters.type !== undefined && filters.type !== "all");

  return { filters, setFilters, resetFilters, hasActiveFilters };
};
