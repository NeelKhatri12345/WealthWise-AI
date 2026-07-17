/**
 * WealthWise AI — Financial Analysis Redux Slice
 *
 * Manages state for:
 *   - POST /ai-coach/analyze  (statementId → FinancialSummary)
 *   - POST /ai-coach/chat     (summary + question → AI reply)
 *
 * Chat history lives only in this slice (no DB persistence at this milestone).
 */

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { financialAnalysisApi, type FinancialSummary } from "@/services/api/financialAnalysis.api";

// ---------------------------------------------------------------------------
// Chat message
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;               // nanoid or Date.now().toString()
  role: ChatRole;
  content: string;
  timestamp: string;        // ISO 8601
  feedback?: "up" | "down" | null;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface FinancialAnalysisState {
  summary: FinancialSummary | null;
  analyzing: boolean;
  analyzeError: string | null;

  chatHistory: ChatMessage[];
  sending: boolean;
  sendError: string | null;

  /** Which statementId was last successfully analyzed */
  analyzedStatementId: string | null;
}

const initialState: FinancialAnalysisState = {
  summary: null,
  analyzing: false,
  analyzeError: null,
  chatHistory: [],
  sending: false,
  sendError: null,
  analyzedStatementId: null,
};

// ---------------------------------------------------------------------------
// Thunks
// ---------------------------------------------------------------------------

export const analyzeStatement = createAsyncThunk(
  "financialAnalysis/analyzeStatement",
  async (statementId: string, { rejectWithValue }) => {
    try {
      const summary = await financialAnalysisApi.analyzeStatement(statementId);
      return { summary, statementId };
    } catch (err: unknown) {
      const errorPayload = err as {
        response?: { data?: { message?: string; detail?: string } };
        message?: string;
      };
      const message =
        errorPayload?.response?.data?.message ??
        errorPayload?.response?.data?.detail ??
        errorPayload?.message ??
        "Failed to analyze statement";
      return rejectWithValue(message);
    }
  },
);

export const sendAnalysisChat = createAsyncThunk(
  "financialAnalysis/sendChat",
  async (
    {
      summary,
      question,
      currency = "INR",
    }: { summary: FinancialSummary; question: string; currency?: string },
    { rejectWithValue },
  ) => {
    try {
      const result = await financialAnalysisApi.chatWithCoach(
        summary,
        question,
        currency,
      );
      return result.reply;
    } catch (err: unknown) {
      const errorPayload = err as {
        response?: { data?: { message?: string; detail?: string } };
        message?: string;
      };
      const message =
        errorPayload?.response?.data?.message ??
        errorPayload?.response?.data?.detail ??
        errorPayload?.message ??
        "Failed to get AI response";
      return rejectWithValue(message);
    }
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const financialAnalysisSlice = createSlice({
  name: "financialAnalysis",
  initialState,
  reducers: {
    appendUserMessage(
      state,
      action: PayloadAction<{ id: string; content: string }>,
    ) {
      state.chatHistory.push({
        id: action.payload.id,
        role: "user",
        content: action.payload.content,
        timestamp: new Date().toISOString(),
        feedback: null,
      });
    },

    setMessageFeedback(
      state,
      action: PayloadAction<{ id: string; feedback: "up" | "down" | null }>,
    ) {
      const msg = state.chatHistory.find((m) => m.id === action.payload.id);
      if (msg) msg.feedback = action.payload.feedback;
    },

    clearChatHistory(state) {
      state.chatHistory = [];
    },

    clearAnalysis(state) {
      state.summary = null;
      state.analyzeError = null;
      state.chatHistory = [];
      state.analyzedStatementId = null;
    },

    clearSendError(state) {
      state.sendError = null;
    },
  },
  extraReducers: (builder) => {
    // ── analyzeStatement ──────────────────────────────────────────────────────
    builder
      .addCase(analyzeStatement.pending, (state) => {
        state.analyzing = true;
        state.analyzeError = null;
      })
      .addCase(analyzeStatement.fulfilled, (state, action) => {
        state.analyzing = false;
        state.summary = action.payload.summary;
        state.analyzedStatementId = action.payload.statementId;
        // Clear chat when a new statement is analyzed
        state.chatHistory = [];
      })
      .addCase(analyzeStatement.rejected, (state, action) => {
        state.analyzing = false;
        state.analyzeError = action.payload as string;
      });

    // ── sendAnalysisChat ──────────────────────────────────────────────────────
    builder
      .addCase(sendAnalysisChat.pending, (state) => {
        state.sending = true;
        state.sendError = null;
      })
      .addCase(sendAnalysisChat.fulfilled, (state, action) => {
        state.sending = false;
        state.chatHistory.push({
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: action.payload,
          timestamp: new Date().toISOString(),
          feedback: null,
        });
      })
      .addCase(sendAnalysisChat.rejected, (state, action) => {
        state.sending = false;
        state.sendError = action.payload as string;
      });
  },
});

export const {
  appendUserMessage,
  setMessageFeedback,
  clearChatHistory,
  clearAnalysis,
  clearSendError,
} = financialAnalysisSlice.actions;

export default financialAnalysisSlice.reducer;
