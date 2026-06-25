import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'credit' | 'debit';
  merchant?: string;
  tags?: string[];
}

export interface TransactionFilters {
  search: string;
  category: string;
  type: 'all' | 'credit' | 'debit';
  dateFrom: string;
  dateTo: string;
  amountMin: number | null;
  amountMax: number | null;
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
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

const initialState: TransactionState = {
  transactions: [],
  filters: {
    search: '',
    category: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: null,
    amountMax: null,
    sortBy: 'date',
    sortOrder: 'desc',
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  categories: [],
  loading: false,
  error: null,
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { transactions: TransactionState };
      const { filters, pagination } = state.transactions;
      const { transactionApi } = await import(
        '../../services/api/transaction.api'
      );
      return await transactionApi.getTransactions({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Failed to fetch transactions'
      );
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'transactions/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { transactionApi } = await import(
        '../../services/api/transaction.api'
      );
      return await transactionApi.getCategories();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Failed to fetch categories'
      );
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<TransactionFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.pagination.page = action.payload;
    },
    resetFilters(state) {
      state.filters = initialState.filters;
      state.pagination.page = 1;
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
      });
  },
});

export const { setFilters, setPage, resetFilters } = transactionSlice.actions;
export default transactionSlice.reducer;
