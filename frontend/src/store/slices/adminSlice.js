import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
const initialState = {
    systemStats: null,
    users: [],
    auditLogs: [],
    monitoring: null,
    loading: false,
    error: null,
};
export const fetchAdminDashboard = createAsyncThunk('admin/fetchDashboard', async (_, { rejectWithValue }) => {
    try {
        const { adminApi } = await import('../../services/api/admin.api');
        const [stats, monitoring] = await Promise.all([
            adminApi.getAdminStats(),
            adminApi.getSystemHealth(),
        ]);
        return { stats, monitoring };
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch admin dashboard');
    }
});
export const fetchUsers = createAsyncThunk('admin/fetchUsers', async (_, { rejectWithValue }) => {
    try {
        const { adminApi } = await import('../../services/api/admin.api');
        return await adminApi.getUsers();
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch users');
    }
});
export const fetchAuditLogs = createAsyncThunk('admin/fetchAuditLogs', async (_, { rejectWithValue }) => {
    try {
        const { adminApi } = await import('../../services/api/admin.api');
        return await adminApi.getAuditLogs();
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch audit logs');
    }
});
const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        clearAdminError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminDashboard.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
            state.loading = false;
            state.systemStats = action.payload.stats;
            state.monitoring = action.payload.monitoring;
        })
            .addCase(fetchAdminDashboard.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
            .addCase(fetchUsers.pending, (state) => {
            state.loading = true;
        })
            .addCase(fetchUsers.fulfilled, (state, action) => {
            state.loading = false;
            state.users = action.payload;
        })
            .addCase(fetchUsers.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
            .addCase(fetchAuditLogs.pending, (state) => {
            state.loading = true;
        })
            .addCase(fetchAuditLogs.fulfilled, (state, action) => {
            state.loading = false;
            state.auditLogs = action.payload;
        })
            .addCase(fetchAuditLogs.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});
export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
