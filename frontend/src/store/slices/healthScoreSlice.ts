import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface HealthMetric {
  name: string;
  value: number;
  maxValue: number;
  status: 'good' | 'fair' | 'poor';
  description: string;
}

export interface HealthTip {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface HealthScoreState {
  currentScore: number | null;
  history: { date: string; score: number }[];
  metrics: HealthMetric[];
  tips: HealthTip[];
  loading: boolean;
  error: string | null;
}

const initialState: HealthScoreState = {
  currentScore: null,
  history: [],
  metrics: [],
  tips: [],
  loading: false,
  error: null,
};

export const fetchHealthScore = createAsyncThunk(
  'healthScore/fetchScore',
  async (_, { rejectWithValue }) => {
    try {
      const { healthApi } = await import('../../services/api/health.api');
      const [scoreData, metrics] = await Promise.all([
        healthApi.getHealthScore(),
        healthApi.getHealthMetrics(),
      ]);
      return { ...scoreData, metrics };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Failed to fetch health score'
      );
    }
  }
);

export const fetchHealthHistory = createAsyncThunk(
  'healthScore/fetchHistory',
  async (period: string = '6m', { rejectWithValue }) => {
    try {
      const { healthApi } = await import('../../services/api/health.api');
      return await healthApi.getHealthHistory(period);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Failed to fetch health history'
      );
    }
  }
);

const healthScoreSlice = createSlice({
  name: 'healthScore',
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
        state.currentScore = action.payload.score;
        state.tips = action.payload.tips;
        state.metrics = action.payload.metrics;
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
