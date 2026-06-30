import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface Recommendation {
  id: string;
  assetClass: string;
  instrument: string;
  action: "buy" | "sell" | "hold";
  currentAllocation: number;
  targetAllocation: number;
  rationale: string;
  confidence: number;
}

export interface Allocation {
  assetClass: string;
  currentValue: number;
  currentPercentage: number;
  targetPercentage: number;
  difference: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
  lastUpdated: string;
}

export interface PortfolioState {
  recommendations: Recommendation[];
  allocations: Allocation[];
  summary: PortfolioSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  recommendations: [],
  allocations: [],
  summary: null,
  loading: false,
  error: null,
};

export const fetchPortfolio = createAsyncThunk(
  "portfolio/fetchPortfolio",
  async (_, { rejectWithValue }) => {
    try {
      const { portfolioApi } = await import("../../services/api/portfolio.api");
      const [allocations, summary] = await Promise.all([
        portfolioApi.getAllocations(),
        portfolioApi.getPortfolioSummary(),
      ]);
      return { allocations, summary };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch portfolio",
      );
    }
  },
);

export const fetchRecommendations = createAsyncThunk(
  "portfolio/fetchRecommendations",
  async (_, { rejectWithValue }) => {
    try {
      const { portfolioApi } = await import("../../services/api/portfolio.api");
      return await portfolioApi.getRecommendations();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch recommendations",
      );
    }
  },
);

const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    clearPortfolioError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.allocations = action.payload.allocations;
        state.summary = action.payload.summary;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPortfolioError } = portfolioSlice.actions;
export default portfolioSlice.reducer;
