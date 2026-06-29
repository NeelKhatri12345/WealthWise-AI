import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
const initialState = {
    stats: null,
    recentTransactions: [],
    widgets: [],
    loading: false,
    error: null,
};
export const fetchDashboardData = createAsyncThunk('dashboard/fetchData', async (_, { rejectWithValue }) => {
    try {
        const { dashboardApi } = await import('../../services/api/dashboard.api');
        const [stats, transactions, widgets] = await Promise.all([
            dashboardApi.getDashboardStats(),
            dashboardApi.getRecentTransactions(),
            dashboardApi.getWidgets(),
        ]);
        return { stats, transactions, widgets };
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch dashboard data');
    }
});
export const refreshStats = createAsyncThunk('dashboard/refreshStats', async (_, { rejectWithValue }) => {
    try {
        const { dashboardApi } = await import('../../services/api/dashboard.api');
        return await dashboardApi.getDashboardStats();
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to refresh stats');
    }
});
const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        clearDashboardError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardData.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(fetchDashboardData.fulfilled, (state, action) => {
            state.loading = false;
            state.stats = action.payload.stats;
            state.recentTransactions = action.payload.transactions;
            state.widgets = action.payload.widgets;
        })
            .addCase(fetchDashboardData.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
            .addCase(refreshStats.fulfilled, (state, action) => {
            state.stats = action.payload;
        });
    },
});
export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
