import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TransactionResponse } from "@/services/api/transaction.api";
import type { RootState } from "@/store";

export interface StatementReviewState {
  statementId: string | null;
  transactions: TransactionResponse[];
  originalTransactions: TransactionResponse[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

const initialState: StatementReviewState = {
  statementId: null,
  transactions: [],
  originalTransactions: [],
  isLoading: false,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,
};

export const fetchStatementTransactions = createAsyncThunk<
  TransactionResponse[],
  string,
  { rejectValue: string }
>(
  "statementReview/fetchTransactions",
  async (statementId, { rejectWithValue }) => {
    try {
      const { transactionApi } = await import("@/services/api/transaction.api");
      return await transactionApi.getTransactionsByStatement(statementId);
    } catch (err: unknown) {
      const axiosErr = err as any;
      return rejectWithValue(
        axiosErr.response?.data?.message ?? axiosErr.message ?? "Failed to fetch transactions."
      );
    }
  }
);

export const saveStatementTransactions = createAsyncThunk<
  void,
  { statementId: string; transactions: TransactionResponse[] },
  { rejectValue: string }
>(
  "statementReview/saveTransactions",
  async ({ statementId, transactions }, { rejectWithValue }) => {
    try {
      const { transactionApi } = await import("@/services/api/transaction.api");
      await transactionApi.syncTransactions(statementId, transactions);
    } catch (err: unknown) {
      const axiosErr = err as any;
      return rejectWithValue(
        axiosErr.response?.data?.message ?? axiosErr.message ?? "Failed to save transactions."
      );
    }
  }
);

const statementReviewSlice = createSlice({
  name: "statementReview",
  initialState,
  reducers: {
    setStatementId(state, action: PayloadAction<string>) {
      if (state.statementId !== action.payload) {
        state.statementId = action.payload;
        state.transactions = [];
        state.originalTransactions = [];
        state.hasUnsavedChanges = false;
        state.error = null;
      }
    },
    updateTransaction(state, action: PayloadAction<TransactionResponse>) {
      const index = state.transactions.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
        state.hasUnsavedChanges = true;
      }
    },
    addTransaction(state, action: PayloadAction<TransactionResponse>) {
      state.transactions.unshift(action.payload);
      state.hasUnsavedChanges = true;
    },
    deleteTransaction(state, action: PayloadAction<string>) {
      state.transactions = state.transactions.filter(t => t.id !== action.payload);
      state.hasUnsavedChanges = true;
    },
    restoreTransactions(state) {
      state.transactions = [...state.originalTransactions];
      state.hasUnsavedChanges = false;
    },
    clearReviewState(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatementTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStatementTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
        state.originalTransactions = action.payload;
        state.hasUnsavedChanges = false;
      })
      .addCase(fetchStatementTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch transactions";
      })
      .addCase(saveStatementTransactions.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveStatementTransactions.fulfilled, (state) => {
        state.isSaving = false;
        state.originalTransactions = [...state.transactions];
        state.hasUnsavedChanges = false;
      })
      .addCase(saveStatementTransactions.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload ?? "Failed to save transactions";
      });
  },
});

export const {
  setStatementId,
  updateTransaction,
  addTransaction,
  deleteTransaction,
  restoreTransactions,
  clearReviewState,
} = statementReviewSlice.actions;

export default statementReviewSlice.reducer;

export const selectReviewTransactions = (state: RootState) => state.statementReview.transactions;
export const selectReviewIsLoading = (state: RootState) => state.statementReview.isLoading;
export const selectReviewIsSaving = (state: RootState) => state.statementReview.isSaving;
export const selectReviewHasUnsavedChanges = (state: RootState) => state.statementReview.hasUnsavedChanges;
export const selectReviewError = (state: RootState) => state.statementReview.error;
