import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PortfolioHolding, PortfolioHoldingInput } from "@/services/api/portfolioHolding.api";

export interface PortfolioHoldingState {
  holdings: PortfolioHolding[];
  loading: boolean;
  error: string | null;
}

const initialState: PortfolioHoldingState = {
  holdings: [],
  loading: false,
  error: null,
};

export const fetchPortfolioHoldings = createAsyncThunk(
  "portfolioHoldings/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { portfolioHoldingApi } = await import(
        "../../services/api/portfolioHolding.api"
      );
      return await portfolioHoldingApi.getHoldings();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch portfolio holdings",
      );
    }
  },
);

export const createPortfolioHoldingThunk = createAsyncThunk(
  "portfolioHoldings/create",
  async (input: PortfolioHoldingInput, { rejectWithValue }) => {
    try {
      const { portfolioHoldingApi } = await import(
        "../../services/api/portfolioHolding.api"
      );
      return await portfolioHoldingApi.createHolding(input);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to create holding",
      );
    }
  },
);

export const updatePortfolioHoldingThunk = createAsyncThunk(
  "portfolioHoldings/update",
  async (
    { id, input }: { id: string; input: Partial<PortfolioHoldingInput> },
    { rejectWithValue },
  ) => {
    try {
      const { portfolioHoldingApi } = await import(
        "../../services/api/portfolioHolding.api"
      );
      return await portfolioHoldingApi.updateHolding(id, input);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to update holding",
      );
    }
  },
);

export const deletePortfolioHoldingThunk = createAsyncThunk(
  "portfolioHoldings/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const { portfolioHoldingApi } = await import(
        "../../services/api/portfolioHolding.api"
      );
      await portfolioHoldingApi.deleteHolding(id);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to delete holding",
      );
    }
  },
);

const portfolioHoldingSlice = createSlice({
  name: "portfolioHoldings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolioHoldings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioHoldings.fulfilled, (state, action) => {
        state.loading = false;
        state.holdings = action.payload;
      })
      .addCase(fetchPortfolioHoldings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPortfolioHoldingThunk.fulfilled, (state, action) => {
        state.holdings.unshift(action.payload);
      })
      .addCase(createPortfolioHoldingThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updatePortfolioHoldingThunk.fulfilled, (state, action) => {
        const index = state.holdings.findIndex((h) => h.id === action.payload.id);
        if (index >= 0) {
          state.holdings[index] = action.payload;
        }
      })
      .addCase(updatePortfolioHoldingThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deletePortfolioHoldingThunk.fulfilled, (state, action) => {
        state.holdings = state.holdings.filter((h) => h.id !== action.payload);
      })
      .addCase(deletePortfolioHoldingThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export default portfolioHoldingSlice.reducer;
