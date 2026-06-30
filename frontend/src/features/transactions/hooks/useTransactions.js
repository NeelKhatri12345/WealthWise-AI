import { useState, useEffect, useCallback } from 'react';
export const useTransactions = ({ page = 1, pageSize = 20, search, } = {}) => {
    const [transactions, setTransactions] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // TODO: Replace with actual API call
            await new Promise((resolve) => setTimeout(resolve, 500));
            void page;
            void pageSize;
            void search;
            setTransactions([]);
            setTotalPages(1);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load transactions');
        }
        finally {
            setIsLoading(false);
        }
    }, [page, pageSize, search]);
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);
    return { transactions, totalPages, isLoading, error, refetch: fetchTransactions };
};
