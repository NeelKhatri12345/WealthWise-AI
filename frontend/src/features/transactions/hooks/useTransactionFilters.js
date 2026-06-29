import { useState, useCallback } from 'react';
const defaultFilters = {
    type: 'all',
};
export const useTransactionFilters = () => {
    const [filters, setFilters] = useState(defaultFilters);
    const resetFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);
    const hasActiveFilters = !!filters.dateFrom ||
        !!filters.dateTo ||
        !!filters.category ||
        filters.minAmount !== undefined ||
        filters.maxAmount !== undefined ||
        (filters.type !== undefined && filters.type !== 'all');
    return { filters, setFilters, resetFilters, hasActiveFilters };
};
