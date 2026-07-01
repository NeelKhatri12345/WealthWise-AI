import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface RiskProfile {
  score: number;
  level: "low" | "moderate" | "high" | "very_high";
  summary: string;
  lastUpdated: string;
}

export interface RiskAssessment {
  questionId: string;
  question: string;
  answer: string;
}

export interface RiskProfileState {
  profile: RiskProfile | null;
  factors: RiskFactor[];
  assessment: RiskAssessment[];
  history: { date: string; score: number }[];
  loading: boolean;
  error: string | null;
}

const initialState: RiskProfileState = {
  profile: null,
  factors: [],
  assessment: [],
  history: [],
  loading: false,
  error: null,
};

export const fetchRiskProfile = createAsyncThunk(
  "riskProfile/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { riskApi } = await import("../../services/api/risk.api");
      const [profile, factors, history] = await Promise.all([
        riskApi.getRiskProfile(),
        riskApi.getRiskFactors(),
        riskApi.getRiskHistory(),
      ]);
      return { profile, factors, history };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch risk profile",
      );
    }
  },
);

export const submitAssessment = createAsyncThunk(
  "riskProfile/submitAssessment",
  async (
    answers: { questionId: string; answer: string }[],
    { rejectWithValue },
  ) => {
    try {
      const { riskApi } = await import("../../services/api/risk.api");
      return await riskApi.submitAssessment(answers);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to submit assessment",
      );
    }
  },
);

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
        state.factors = action.payload.factors;
        state.history = action.payload.history;
      })
      .addCase(fetchRiskProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(submitAssessment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitAssessment.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(submitAssessment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearRiskError } = riskProfileSlice.actions;
export default riskProfileSlice.reducer;
