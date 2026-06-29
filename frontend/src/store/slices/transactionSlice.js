import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
const initialState = {
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
export const fetchTransactions = createAsyncThunk('transactions/fetchTransactions', async (_, { getState, rejectWithValue }) => {
    try {
        const state = getState();
        const { filters, pagination } = state.transactions;
        const { transactionApi } = await import('../../services/api/transaction.api');
        return await transactionApi.getTransactions({
            ...filters,
            page: pagination.page,
            pageSize: pagination.pageSize,
        });
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch transactions');
    }
});
export const fetchCategories = createAsyncThunk('transactions/fetchCategories', async (_, { rejectWithValue }) => {
    try {
        const { transactionApi } = await import('../../services/api/transaction.api');
        return await transactionApi.getCategories();
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch categories');
    }
});
const transactionSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        setFilters(state, action) {
            state.filters = { ...state.filters, ...action.payload };
            state.pagination.page = 1;
        },
        setPage(state, action) {
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
            state.error = action.payload;
        })
            .addCase(fetchCategories.fulfilled, (state, action) => {
            state.categories = action.payload;
        });
    },
});
export const { setFilters, setPage, resetFilters } = transactionSlice.actions;
export default transactionSlice.reducer;
