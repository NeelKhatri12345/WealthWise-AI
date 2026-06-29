import { useState, useCallback, useMemo } from "react";
export function usePagination({ initialPage = 1, initialPageSize = 20, totalItems = 0, } = {}) {
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [totalItems, pageSize]);
    const goToPage = useCallback((p) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages]);
    const nextPage = useCallback(() => setPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
    const prevPage = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
    const changePageSize = useCallback((size) => {
        setPageSize(size);
        setPage(1);
    }, []);
    return {
        page,
        pageSize,
        totalPages,
        totalItems,
        goToPage,
        nextPage,
        prevPage,
        changePageSize,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        offset: (page - 1) * pageSize,
    };
}
