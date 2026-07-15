import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { type HealthScoreDetailResponse } from "../../services/api/health.api";
import type { RootState } from "../index";

export interface HealthScoreState {
  scoreData: HealthScoreDetailResponse | null;
  history: HealthScoreDetailResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: HealthScoreState = {
  scoreData: null,
  history: [],
  loading: false,
  error: null,
};

export const fetchHealthScore = createAsyncThunk(
  "healthScore/fetchScore",
  async (_, { rejectWithValue }) => {
    try {
      const { healthApi } = await import("../../services/api/health.api");
      const scoreData = await healthApi.getHealthScore();
      return scoreData;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch health score",
      );
    }
  },
);

export const fetchHealthHistory = createAsyncThunk(
  "healthScore/fetchHistory",
  async (period: string = "6m", { rejectWithValue }) => {
    try {
      const { healthApi } = await import("../../services/api/health.api");
      return await healthApi.getHealthHistory(period);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch health history",
      );
    }
  },
);

const healthScoreSlice = createSlice({
  name: "healthScore",
  initialState,
  reducers: {
    clearHealthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthScore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHealthScore.fulfilled, (state, action) => {
        state.loading = false;
        state.scoreData = action.payload;
      })
      .addCase(fetchHealthScore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHealthHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHealthHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchHealthHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearHealthError } = healthScoreSlice.actions;
export default healthScoreSlice.reducer;

export const selectHealthScore = (state: RootState) => state.healthScore;
