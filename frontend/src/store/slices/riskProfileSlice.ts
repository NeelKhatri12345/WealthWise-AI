import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

// ── Types — aligned with backend RiskProfileResponse ──────────────────────────

export interface RiskProfile {
  id: string;
  statement_id: string;
  risk_level: "low" | "moderate" | "high" | "very_high";
  risk_score: number;
  confidence: number | null;
  feature_inputs: Record<string, unknown> | null;
  calculated_at: string;
}

export interface RiskProfileState {
  profile: RiskProfile | null;
  history: RiskProfile[];
  loading: boolean;
  error: string | null;
}

const initialState: RiskProfileState = {
  profile: null,
  history: [],
  loading: false,
  error: null,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchRiskProfile = createAsyncThunk(
  "riskProfile/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { riskApi } = await import("../../services/api/risk.api");
      const profile = await riskApi.getRiskProfile();
      return { profile };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch risk profile",
      );
    }
  },
);

export const fetchRiskHistory = createAsyncThunk(
  "riskProfile/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      const { riskApi } = await import("../../services/api/risk.api");
      return await riskApi.getRiskHistory();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch risk history",
      );
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const riskProfileSlice = createSlice({
  name: "riskProfile",
  initialState,
  reducers: {
    clearRiskError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRiskProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRiskProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
      })
      .addCase(fetchRiskProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRiskHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRiskHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchRiskHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectRiskProfile = (state: RootState) => state.riskProfile;

export const { clearRiskError } = riskProfileSlice.actions;
export default riskProfileSlice.reducer;
