interface TransactionFilters {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    type?: 'all' | 'credit' | 'debit';
}
interface UseTransactionFiltersReturn {
    filters: TransactionFilters;
    setFilters: (filters: TransactionFilters) => void;
    resetFilters: () => void;
    hasActiveFilters: boolean;
}
export declare const useTransactionFilters: () => UseTransactionFiltersReturn;
export {};
