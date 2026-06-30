interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
}
export declare function usePagination({
  initialPage,
  initialPageSize,
  totalItems,
}?: UsePaginationOptions): {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  goToPage: (p: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  changePageSize: (size: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  offset: number;
};
export {};
