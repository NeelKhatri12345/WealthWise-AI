/**
 * WealthWise AI — Dashboard Redux Slice
 *
 * Granular loading/error state per section so each dashboard
 * card can independently show skeleton/error/retry.
 *
 * State shape:
 *   summary    → { data, loading, error }
 *   transactions → { data[], loading, error }
 *   insights   → { data[], loading, error }
 *   notifications → { data[], loading, error }
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type {
  DashboardInsight,
  DashboardNotification,
  DashboardSummary,
  DashboardTransaction,
} from "@/services/api/dashboard.api";
import type { RootState } from "@/store";

// ---------------------------------------------------------------------------
// Section state shape
// ---------------------------------------------------------------------------

interface SectionState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Root slice state
// ---------------------------------------------------------------------------

export interface DashboardState {
  summary: SectionState<DashboardSummary | null>;
  transactions: SectionState<DashboardTransaction[]>;
  insights: SectionState<DashboardInsight[]>;
  notifications: SectionState<DashboardNotification[]>;
}

const initialSection = <T>(empty: T): SectionState<T> => ({
  data: empty,
  loading: false,
  error: null,
});

const initialState: DashboardState = {
  summary: initialSection(null),
  transactions: initialSection([]),
  insights: initialSection([]),
  notifications: initialSection([]),
};

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchDashboardSummary = createAsyncThunk<
  DashboardSummary,
  void,
  { rejectValue: string }
>("dashboard/fetchSummary", async (_, { rejectWithValue }) => {
  try {
    const { dashboardApi } = await import("@/services/api/dashboard.api");
    return await dashboardApi.getSummary();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? "Failed to load summary");
  }
});

export const fetchRecentTransactions = createAsyncThunk<
  DashboardTransaction[],
  void,
  { rejectValue: string }
>("dashboard/fetchTransactions", async (_, { rejectWithValue }) => {
  try {
    const { dashboardApi } = await import("@/services/api/dashboard.api");
    return await dashboardApi.getRecentTransactions();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? "Failed to load transactions");
  }
});

export const fetchDashboardInsights = createAsyncThunk<
  DashboardInsight[],
  void,
  { rejectValue: string }
>("dashboard/fetchInsights", async (_, { rejectWithValue }) => {
  try {
    const { dashboardApi } = await import("@/services/api/dashboard.api");
    return await dashboardApi.getInsights();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? "Failed to load insights");
  }
});

export const fetchDashboardNotifications = createAsyncThunk<
  DashboardNotification[],
  void,
  { rejectValue: string }
>("dashboard/fetchNotifications", async (_, { rejectWithValue }) => {
  try {
    const { dashboardApi } = await import("@/services/api/dashboard.api");
    return await dashboardApi.getNotifications();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(
      e.response?.data?.message ?? "Failed to load notifications",
    );
  }
});

/** Convenience thunk — dispatches all four in parallel. */
export const fetchDashboardAll = createAsyncThunk<void, void>(
  "dashboard/fetchAll",
  async (_, { dispatch }) => {
    await Promise.allSettled([
      dispatch(fetchDashboardSummary()),
      dispatch(fetchRecentTransactions()),
      dispatch(fetchDashboardInsights()),
      dispatch(fetchDashboardNotifications()),
    ]);
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearSummaryError(state) {
      state.summary.error = null;
    },
    clearTransactionsError(state) {
      state.transactions.error = null;
    },
    clearInsightsError(state) {
      state.insights.error = null;
    },
    clearNotificationsError(state) {
      state.notifications.error = null;
    },
    resetDashboard() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Summary
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        state.summary.data = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload ?? "Unknown error";
      });

    // Transactions
    builder
      .addCase(fetchRecentTransactions.pending, (state) => {
        state.transactions.loading = true;
        state.transactions.error = null;
      })
      .addCase(fetchRecentTransactions.fulfilled, (state, action) => {
        state.transactions.loading = false;
        state.transactions.data = action.payload;
      })
      .addCase(fetchRecentTransactions.rejected, (state, action) => {
        state.transactions.loading = false;
        state.transactions.error = action.payload ?? "Unknown error";
      });

    // Insights
    builder
      .addCase(fetchDashboardInsights.pending, (state) => {
        state.insights.loading = true;
        state.insights.error = null;
      })
      .addCase(fetchDashboardInsights.fulfilled, (state, action) => {
        state.insights.loading = false;
        state.insights.data = action.payload;
      })
      .addCase(fetchDashboardInsights.rejected, (state, action) => {
        state.insights.loading = false;
        state.insights.error = action.payload ?? "Unknown error";
      });

    // Notifications
    builder
      .addCase(fetchDashboardNotifications.pending, (state) => {
        state.notifications.loading = true;
        state.notifications.error = null;
      })
      .addCase(fetchDashboardNotifications.fulfilled, (state, action) => {
        state.notifications.loading = false;
        state.notifications.data = action.payload;
      })
      .addCase(fetchDashboardNotifications.rejected, (state, action) => {
        state.notifications.loading = false;
        state.notifications.error = action.payload ?? "Unknown error";
      });
  },
});

export const {
  clearSummaryError,
  clearTransactionsError,
  clearInsightsError,
  clearNotificationsError,
  resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectDashboardSummary = (state: RootState) =>
  state.dashboard.summary;

export const selectDashboardTransactions = (state: RootState) =>
  state.dashboard.transactions;

export const selectDashboardInsights = (state: RootState) =>
  state.dashboard.insights;

export const selectDashboardNotifications = (state: RootState) =>
  state.dashboard.notifications;

export const selectIsDashboardLoading = (state: RootState) =>
  state.dashboard.summary.loading ||
  state.dashboard.transactions.loading ||
  state.dashboard.insights.loading ||
  state.dashboard.notifications.loading;
