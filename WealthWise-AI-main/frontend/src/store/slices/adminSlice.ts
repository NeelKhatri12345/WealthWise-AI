import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  storageUsed: number;
  cpuUsage: number;
  memoryUsage: number;
  apiRequestsToday: number;
  errorRate: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface MonitoringData {
  cpu: number[];
  memory: number[];
  requests: number[];
  errors: number[];
  timestamps: string[];
}

export interface AdminState {
  systemStats: SystemStats | null;
  users: AdminUser[];
  auditLogs: AuditLog[];
  monitoring: MonitoringData | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  systemStats: null,
  users: [],
  auditLogs: [],
  monitoring: null,
  loading: false,
  error: null,
};

export const fetchAdminDashboard = createAsyncThunk(
  "admin/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const { adminApi } = await import("../../services/api/admin.api");
      const [stats, monitoring] = await Promise.all([
        adminApi.getAdminStats(),
        adminApi.getSystemHealth(),
      ]);
      return { stats, monitoring };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch admin dashboard",
      );
    }
  },
);

export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const { adminApi } = await import("../../services/api/admin.api");
      return await adminApi.getUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch users",
      );
    }
  },
);

export const fetchAuditLogs = createAsyncThunk(
  "admin/fetchAuditLogs",
  async (_, { rejectWithValue }) => {
    try {
      const { adminApi } = await import("../../services/api/admin.api");
      return await adminApi.getAuditLogs();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch audit logs",
      );
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
