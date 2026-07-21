import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import type {
  InvestmentRecommendationSnapshot,
  InvestmentHistoryItem,
} from "../../services/api/investmentRecommendation.api";

export interface InvestmentRecommendationState {
  snapshot: InvestmentRecommendationSnapshot | null;
  history: InvestmentHistoryItem[];
  loading: boolean;
  calculating: boolean;
  error: string | null;
}

const initialState: InvestmentRecommendationState = {
  snapshot: null,
  history: [],
  loading: false,
  calculating: false,
  error: null,
};

export const fetchLatestRecommendation = createAsyncThunk(
  "investmentRecommendation/fetchLatest",
  async (_, { rejectWithValue }) => {
    try {
      const { investmentRecommendationApi } = await import(
        "../../services/api/investmentRecommendation.api"
      );
      return await investmentRecommendationApi.getLatest();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch investment recommendation"
      );
    }
  }
);

export const calculateRecommendation = createAsyncThunk(
  "investmentRecommendation/calculate",
  async (_, { rejectWithValue }) => {
    try {
      const { investmentRecommendationApi } = await import(
        "../../services/api/investmentRecommendation.api"
      );
      return await investmentRecommendationApi.calculate();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      return rejectWithValue(
        error.response?.data?.detail ??
          error.response?.data?.message ??
          "Failed to calculate investment recommendation"
      );
    }
  }
);

export const fetchRecommendationHistory = createAsyncThunk(
  "investmentRecommendation/fetchHistory",
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const { investmentRecommendationApi } = await import(
        "../../services/api/investmentRecommendation.api"
      );
      return await investmentRecommendationApi.getHistory(limit);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch recommendation history"
      );
    }
  }
);

const investmentRecommendationSlice = createSlice({
  name: "investmentRecommendation",
  initialState,
  reducers: {
    clearInvestmentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Latest
    builder
      .addCase(fetchLatestRecommendation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLatestRecommendation.fulfilled, (state, action) => {
        state.loading = false;
        state.snapshot = action.payload;
      })
      .addCase(fetchLatestRecommendation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Calculate
    builder
      .addCase(calculateRecommendation.pending, (state) => {
        state.calculating = true;
        state.error = null;
      })
      .addCase(calculateRecommendation.fulfilled, (state, action) => {
        state.calculating = false;
        state.snapshot = action.payload;
      })
      .addCase(calculateRecommendation.rejected, (state, action) => {
        state.calculating = false;
        state.error = action.payload as string;
      });

    // History
    builder
      .addCase(fetchRecommendationHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecommendationHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchRecommendationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearInvestmentError } = investmentRecommendationSlice.actions;
export default investmentRecommendationSlice.reducer;
export const selectInvestmentRecommendation = (state: RootState) =>
  state.investmentRecommendation;
