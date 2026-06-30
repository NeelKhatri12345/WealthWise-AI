export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "credit" | "debit";
  merchant?: string;
  tags?: string[];
}
export interface TransactionFilters {
  search: string;
  category: string;
  type: "all" | "credit" | "debit";
  dateFrom: string;
  dateTo: string;
  amountMin: number | null;
  amountMax: number | null;
  sortBy: "date" | "amount" | "category";
  sortOrder: "asc" | "desc";
}
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
export interface TransactionState {
  transactions: Transaction[];
  filters: TransactionFilters;
  pagination: Pagination;
  categories: Category[];
  loading: boolean;
  error: string | null;
}
export declare const fetchTransactions: import("@reduxjs/toolkit").AsyncThunk<
  import("../../services").PaginatedResponse<
    import("../../services/api/transaction.api").TransactionResponse
  >,
  void,
  import("@reduxjs/toolkit").AsyncThunkConfig
>;
export declare const fetchCategories: import("@reduxjs/toolkit").AsyncThunk<
  import("../../services/api/transaction.api").CategoryResponse[],
  void,
  import("@reduxjs/toolkit").AsyncThunkConfig
>;
export declare const setFilters: import("@reduxjs/toolkit").ActionCreatorWithPayload<
    Partial<TransactionFilters>,
    "transactions/setFilters"
  >,
  setPage: import("@reduxjs/toolkit").ActionCreatorWithPayload<
    number,
    "transactions/setPage"
  >,
  resetFilters: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"transactions/resetFilters">;
declare const _default: import("redux").Reducer<TransactionState>;
export default _default;
