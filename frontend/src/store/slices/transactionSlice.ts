import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

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
  sortBy: string;
  sortOrder: "asc" | "desc";
  statementId: string;
  merchant: string;
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
  selectedIds: string[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transactions: [],
  filters: {
    search: "",
    category: "",
    type: "all",
    dateFrom: "",
    dateTo: "",
    amountMin: null,
    amountMax: null,
    sortBy: "date",
    sortOrder: "desc",
    statementId: "",
    merchant: "",
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  categories: [],
  selectedIds: [],
  loading: false,
  error: null,
};

export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { transactions: TransactionState };
      const { filters, pagination } = state.transactions;
      const { transactionApi } =
        await import("../../services/api/transaction.api");
      return await transactionApi.getTransactions({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch transactions",
      );
    }
  },
);

export const fetchCategories = createAsyncThunk(
  "transactions/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const { transactionApi } =
        await import("../../services/api/transaction.api");
      return await transactionApi.getCategories();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch categories",
      );
    }
  },
);

export const updateTransactionThunk = createAsyncThunk(
  "transactions/update",
  async (
    { id, data }: { id: string; data: Partial<Transaction> },
    { rejectWithValue },
  ) => {
    try {
      const { transactionApi } = await import("../../services/api/transaction.api");
      return await transactionApi.updateTransaction(id, data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to update transaction",
      );
    }
  },
);

export const deleteTransactionThunk = createAsyncThunk(
  "transactions/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const { transactionApi } = await import("../../services/api/transaction.api");
      await transactionApi.deleteTransaction(id);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to delete transaction",
      );
    }
  },
);

export const bulkUpdateCategoryThunk = createAsyncThunk(
  "transactions/bulkUpdateCategory",
  async (
    { transactionIds, category }: { transactionIds: string[]; category: string },
    { rejectWithValue },
  ) => {
    try {
      const { transactionApi } = await import("../../services/api/transaction.api");
      await transactionApi.bulkUpdateCategory(transactionIds, category);
      return { transactionIds, category };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to bulk update categories",
      );
    }
  },
);

export const bulkDeleteTransactionsThunk = createAsyncThunk(
  "transactions/bulkDelete",
  async (transactionIds: string[], { rejectWithValue }) => {
    try {
      const { transactionApi } = await import("../../services/api/transaction.api");
      await transactionApi.bulkDeleteTransactions(transactionIds);
      return transactionIds;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to bulk delete transactions",
      );
    }
  },
);

export const deleteAllTransactionsThunk = createAsyncThunk(
  "transactions/deleteAll",
  async (_, { rejectWithValue }) => {
    try {
      const { transactionApi } = await import("../../services/api/transaction.api");
      return await transactionApi.deleteAllTransactions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to delete all transactions",
      );
    }
  },
);

const transactionSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<TransactionFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
      state.selectedIds = [];
    },
    setPage(state, action: PayloadAction<number>) {
      state.pagination.page = action.payload;
    },
    resetFilters(state) {
      state.filters = initialState.filters;
      state.pagination.page = 1;
      state.selectedIds = [];
    },
    toggleSelection(state, action: PayloadAction<string>) {
      const index = state.selectedIds.indexOf(action.payload);
      if (index >= 0) {
        state.selectedIds.splice(index, 1);
      } else {
        state.selectedIds.push(action.payload);
      }
    },
    selectAll(state, action: PayloadAction<boolean>) {
      if (action.payload) {
        state.selectedIds = state.transactions.map((t) => t.id);
      } else {
        state.selectedIds = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(updateTransactionThunk.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index >= 0) {
          state.transactions[index] = action.payload as Transaction; // Cast as transaction types mismatch slightly due to interface duplicating
        }
      })
      .addCase(deleteTransactionThunk.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(t => t.id !== action.payload);
        state.selectedIds = state.selectedIds.filter(id => id !== action.payload);
      })
      .addCase(bulkUpdateCategoryThunk.fulfilled, (state, action) => {
        const { transactionIds, category } = action.payload;
        state.transactions = state.transactions.map(t => 
          transactionIds.includes(t.id) ? { ...t, category } : t
        );
        state.selectedIds = [];
      })
      .addCase(bulkDeleteTransactionsThunk.fulfilled, (state, action) => {
        const deletedIds = action.payload;
        state.transactions = state.transactions.filter(t => !deletedIds.includes(t.id));
        state.selectedIds = [];
      })
      .addCase(deleteAllTransactionsThunk.fulfilled, (state) => {
        state.transactions = [];
        state.selectedIds = [];
        state.pagination.total = 0;
        state.pagination.totalPages = 0;
      });
  },
});

export const { setFilters, setPage, resetFilters, toggleSelection, selectAll } = transactionSlice.actions;
export default transactionSlice.reducer;
